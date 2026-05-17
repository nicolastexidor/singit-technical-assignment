import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserVocabulary, UserVocabularyDocument, VocabStatus } from './schemas/user-vocabulary.schema';
import { WordInsight, WordInsightDocument } from '../insights/schemas/word-insight.schema';

/**
 * Priority score formula (higher = practice sooner):
 *   statusWeight + (frequency × 0.1) − recencyPenalty
 *
 * statusWeight:   unknown=3, learning=2, known=0, ignored=−10
 * recencyPenalty: min(hoursSinceLastPracticed / 24, 1.0)
 */
const STATUS_WEIGHT: Record<VocabStatus, number> = {
  unknown: 3,
  learning: 2,
  known: 0,
  ignored: -10,
};

function priorityScore(status: VocabStatus, frequency: number, lastPracticedAt: Date | null): number {
  const recencyPenalty = lastPracticedAt
    ? Math.min((Date.now() - lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24), 1.0)
    : 0;
  return STATUS_WEIGHT[status] + frequency * 0.1 - recencyPenalty;
}

function recommendationReason(status: VocabStatus, incorrectCount: number): string {
  if (status === 'unknown') return 'New word — never practiced';
  if (status === 'learning' && incorrectCount > 0) return 'Previously answered incorrectly';
  if (status === 'learning') return 'In progress — keep practicing';
  if (status === 'known') return 'Already known — review to reinforce';
  return 'Ignored';
}

/**
 * Vocabulary state transition rules applied after each exercise attempt:
 *   correct:   unknown→learning, learning→known if correctCount≥2, known stays
 *   incorrect: known→learning, others stay
 */
export function nextStatus(current: VocabStatus, isCorrect: boolean, newCorrectCount: number): VocabStatus {
  if (isCorrect) {
    if (current === 'unknown') return 'learning';
    if (current === 'learning') return newCorrectCount >= 3 ? 'known' : 'learning';
    return current;
  } else {
    if (current === 'known') return 'learning';
    return current;
  }
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserVocabulary.name) private readonly vocabModel: Model<UserVocabularyDocument>,
    @InjectModel(WordInsight.name) private readonly insightModel: Model<WordInsightDocument>,
  ) {}

  async getUserInsights(userId: string, filters: { language?: string; status?: VocabStatus }) {
    const vocabFilter: Record<string, unknown> = { userId };
    if (filters.status) vocabFilter.status = filters.status;
    if (filters.language) vocabFilter.language = filters.language;

    const vocabEntries = await this.vocabModel.find(vocabFilter).lean();
    const insightIds = vocabEntries.map((v) => v.wordInsightId);

    const insights = await this.insightModel.find({ _id: { $in: insightIds } }).lean();
    const insightMap = new Map(insights.map((i) => [String(i._id), i]));

    return vocabEntries
      .map((v) => {
        const insight = insightMap.get(String(v.wordInsightId));
        if (!insight) return null;
        const score = priorityScore(v.status, insight.frequency, v.lastPracticedAt);
        return {
          insight,
          vocabularyState: {
            status: v.status,
            correctCount: v.correctCount,
            incorrectCount: v.incorrectCount,
            lastPracticedAt: v.lastPracticedAt,
          },
          priorityScore: score,
          recommendationReason: recommendationReason(v.status, v.incorrectCount),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  async updateVocabularyStatus(userId: string, insightId: string, status: VocabStatus) {
    const insight = await this.insightModel.findById(insightId).lean();
    if (!insight) throw new NotFoundException('WordInsight not found');

    return this.vocabModel.findOneAndUpdate(
      { userId, wordInsightId: new Types.ObjectId(insightId) },
      {
        $set: { status },
        $setOnInsert: {
          normalizedWord: insight.normalizedWord,
          language: insight.language,
          correctCount: 0,
          incorrectCount: 0,
          lastPracticedAt: null,
        },
      },
      { upsert: true, new: true },
    );
  }

  async applyAttemptResult(
    userId: string,
    wordInsightId: Types.ObjectId,
    normalizedWord: string,
    language: string,
    isCorrect: boolean,
  ): Promise<{ previousStatus: VocabStatus; newStatus: VocabStatus }> {
    let vocab = await this.vocabModel.findOne({ userId, wordInsightId });

    if (!vocab) {
      vocab = await this.vocabModel.create({
        userId,
        wordInsightId,
        normalizedWord,
        language,
        status: 'unknown',
        correctCount: 0,
        incorrectCount: 0,
        lastPracticedAt: null,
      });
    }

    const previousStatus = vocab.status;
    const newCorrectCount = isCorrect ? vocab.correctCount + 1 : vocab.correctCount;
    const newStatus = nextStatus(previousStatus, isCorrect, newCorrectCount);

    await this.vocabModel.updateOne(
      { _id: vocab._id },
      {
        $set: {
          status: newStatus,
          correctCount: newCorrectCount,
          incorrectCount: isCorrect ? vocab.incorrectCount : vocab.incorrectCount + 1,
          lastPracticedAt: new Date(),
        },
      },
    );

    return { previousStatus, newStatus };
  }

  async getSummary(userId: string) {
    const counts = await this.vocabModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts: Record<string, number> = { unknown: 0, learning: 0, known: 0, ignored: 0 };
    for (const c of counts) statusCounts[c._id] = c.count;

    const [stats] = await this.vocabModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalCorrect: { $sum: '$correctCount' },
          totalIncorrect: { $sum: '$incorrectCount' },
          totalPracticed: { $sum: { $cond: [{ $gt: ['$lastPracticedAt', null] }, 1, 0] } },
        },
      },
    ]);

    const recommended = await this.vocabModel
      .find({ userId, status: { $in: ['unknown', 'learning'] } })
      .sort({ lastPracticedAt: 1 })
      .limit(5)
      .lean();

    return {
      statusCounts,
      attemptStats: {
        totalCorrect: stats?.totalCorrect ?? 0,
        totalIncorrect: stats?.totalIncorrect ?? 0,
        totalPracticed: stats?.totalPracticed ?? 0,
      },
      recommendedWords: recommended.map((v) => ({
        insightId: String(v.wordInsightId),
        normalizedWord: v.normalizedWord,
        status: v.status,
        lastPracticedAt: v.lastPracticedAt,
      })),
    };
  }
}
