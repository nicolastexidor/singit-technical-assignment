import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PracticeSession, PracticeSessionDocument } from './schemas/practice-session.schema';
import { ExerciseAttempt, ExerciseAttemptDocument } from './schemas/exercise-attempt.schema';
import { UserVocabulary, UserVocabularyDocument } from '../users/schemas/user-vocabulary.schema';
import { WordInsight, WordInsightDocument } from '../insights/schemas/word-insight.schema';
import { ExerciseService } from './exercise.service';
import { UsersService } from '../users/users.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(PracticeSession.name) private readonly sessionModel: Model<PracticeSessionDocument>,
    @InjectModel(ExerciseAttempt.name) private readonly attemptModel: Model<ExerciseAttemptDocument>,
    @InjectModel(UserVocabulary.name) private readonly vocabModel: Model<UserVocabularyDocument>,
    @InjectModel(WordInsight.name) private readonly insightModel: Model<WordInsightDocument>,
    private readonly exerciseService: ExerciseService,
    private readonly usersService: UsersService,
  ) {}

  async createSession(userId: string, dto: CreateSessionDto) {
    const limit = Math.min(dto.limit ?? 10, 50);
    const statuses = dto.statuses ?? ['unknown', 'learning'];
    const exerciseTypes = dto.exerciseTypes ?? ['word_meaning', 'reverse_translation'];

    const words = await this.exerciseService.selectWords({
      userId,
      sourceLanguage: dto.sourceLanguage,
      limit,
      statuses,
    });

    if (words.length === 0) {
      throw new BadRequestException('No suitable words found for the given criteria');
    }

    const exercises = await this.exerciseService.buildExercises(
      words,
      dto.translationLanguage,
      exerciseTypes,
    );

    if (exercises.length === 0) {
      throw new BadRequestException(
        `Could not generate exercises. Ensure translationLanguage "${dto.translationLanguage}" exists in word insights.`,
      );
    }

    return this.sessionModel.create({
      userId,
      sourceLanguage: dto.sourceLanguage,
      translationLanguage: dto.translationLanguage,
      exercises,
      status: 'active',
    });
  }

  async submitAttempt(sessionId: string, exerciseId: string, dto: SubmitAttemptDto) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== dto.userId) throw new BadRequestException('Session does not belong to this user');
    if (session.status === 'completed') throw new BadRequestException('Session is already completed');

    const exercise = session.exercises.find((e) => e.id === exerciseId);
    if (!exercise) throw new NotFoundException('Exercise not found in session');
    if (exercise.answeredAt) throw new BadRequestException('Exercise already answered');

    const isCorrect = dto.answer === exercise.correctOptionId;
    exercise.answeredAt = new Date();

    const allAnswered = session.exercises.every((e) => e.answeredAt !== null);
    if (allAnswered) session.status = 'completed';
    await session.save();

    const insight = await this.insightModel.findById(exercise.wordInsightId).lean();

    await this.attemptModel.create({
      userId: dto.userId,
      sessionId: new Types.ObjectId(sessionId),
      exerciseId,
      wordInsightId: exercise.wordInsightId,
      word: exercise.word,
      exerciseType: exercise.type,
      answer: dto.answer,
      isCorrect,
    });

    const { previousStatus, newStatus } = await this.usersService.applyAttemptResult(
      dto.userId,
      exercise.wordInsightId,
      insight?.normalizedWord ?? exercise.word,
      insight?.language ?? session.sourceLanguage,
      isCorrect,
    );

    return {
      exerciseId,
      isCorrect,
      correctOptionId: exercise.correctOptionId,
      previousVocabularyStatus: previousStatus,
      newVocabularyStatus: newStatus,
      sessionCompleted: session.status === 'completed',
    };
  }

  async getResults(sessionId: string, userId: string) {
    const session = await this.sessionModel.findById(sessionId).lean();
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new NotFoundException('Session does not belong to this user');

    const attempts = await this.attemptModel.find({ sessionId: new Types.ObjectId(sessionId) }).lean();
    const attemptMap = new Map(attempts.map((a) => [a.exerciseId, a]));

    const insightIds = [...new Set(session.exercises.map((e) => String(e.wordInsightId)))].map(
      (id) => new Types.ObjectId(id),
    );
    const vocabEntries = await this.vocabModel
      .find({ userId, wordInsightId: { $in: insightIds } })
      .lean();
    const vocabMap = new Map(vocabEntries.map((v) => [String(v.wordInsightId), v.status]));

    return {
      sessionId,
      status: session.status,
      sourceLanguage: session.sourceLanguage,
      translationLanguage: session.translationLanguage,
      totalExercises: session.exercises.length,
      completedCount: session.exercises.filter((e) => e.answeredAt !== null).length,
      pendingCount: session.exercises.filter((e) => e.answeredAt === null).length,
      correctCount: attempts.filter((a) => a.isCorrect).length,
      incorrectCount: attempts.filter((a) => !a.isCorrect).length,
      exercises: session.exercises.map((e) => ({
        id: e.id,
        type: e.type,
        word: e.word,
        prompt: e.prompt,
        answered: !!e.answeredAt,
        isCorrect: attemptMap.get(e.id)?.isCorrect ?? null,
        currentVocabularyStatus: vocabMap.get(String(e.wordInsightId)) ?? 'unknown',
      })),
    };
  }
}
