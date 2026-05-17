import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { WordInsight, WordInsightDocument } from '../insights/schemas/word-insight.schema';
import { UserVocabulary, UserVocabularyDocument, VocabStatus } from '../users/schemas/user-vocabulary.schema';
import { Exercise, ExerciseOption, ExerciseType } from './schemas/practice-session.schema';
import { STATUS_WEIGHT } from '../common/constants';

function score(status: VocabStatus, frequency: number): number {
  return STATUS_WEIGHT[status] + frequency * 0.1;
}

const OPTION_COUNT = 4;

export interface SelectWordsParams {
  userId: string;
  learningLanguage: string;
  limit: number;
  statuses: VocabStatus[];
}

@Injectable()
export class ExerciseService {
  random: () => number = Math.random;

  constructor(
    @InjectModel(WordInsight.name) private readonly insightModel: Model<WordInsightDocument>,
    @InjectModel(UserVocabulary.name) private readonly vocabModel: Model<UserVocabularyDocument>,
  ) {}

  async selectWords(params: SelectWordsParams): Promise<WordInsightDocument[]> {
    const vocabEntries = await this.vocabModel
      .find({ userId: params.userId, language: params.learningLanguage, status: { $in: params.statuses } })
      .lean();

    const vocabMap = new Map(vocabEntries.map((v) => [String(v.wordInsightId), v]));

    let candidates: WordInsightDocument[] = [];

    if (vocabEntries.length > 0) {
      candidates = await this.insightModel
        .find({ _id: { $in: vocabEntries.map((v) => v.wordInsightId) }, language: params.learningLanguage })
        .lean() as unknown as WordInsightDocument[];
    }

    if (params.statuses.includes('unknown') && candidates.length < params.limit) {
      const seenIds = new Set(vocabEntries.map((v) => String(v.wordInsightId)));
      const unseen = await this.insightModel
        .find({
          _id: { $nin: [...seenIds].map((id) => new Types.ObjectId(id)) },
          language: params.learningLanguage,
        })
        .sort({ frequency: -1 })
        .limit(params.limit * 2)
        .lean() as unknown as WordInsightDocument[];
      candidates.push(...unseen);
    }

    candidates.sort((a, b) => {
      const va = vocabMap.get(String(a._id));
      const vb = vocabMap.get(String(b._id));
      return (
        score(vb?.status ?? 'unknown', b.frequency) -
        score(va?.status ?? 'unknown', a.frequency)
      );
    });

    return candidates.slice(0, params.limit);
  }

  async buildExercises(
    words: WordInsightDocument[],
    nativeLanguage: string,
    exerciseTypes: ExerciseType[],
  ): Promise<Exercise[]> {
    const wordIds = new Set(words.map((w) => String(w._id)));
    const distractorPool = await this.insightModel
      .find({
        _id: { $nin: [...wordIds].map((id) => new Types.ObjectId(id)) },
        language: words[0]?.language ?? 'en',
      })
      .sort({ frequency: -1 })
      .limit(50)
      .lean() as WordInsightDocument[];

    const exercises: Exercise[] = [];
    let typeIndex = 0;

    for (const word of words) {
      const translation = word.translations.find((t) => t.language === nativeLanguage);
      const availableTypes = exerciseTypes.filter((t) => {
        if ((t === 'word_meaning' || t === 'reverse_translation') && !translation) return false;
        if (t === 'word_to_image' && word.imageRefs.length === 0) return false;
        return true;
      });

      if (availableTypes.length === 0) continue;

      const type = availableTypes[typeIndex % availableTypes.length];
      typeIndex++;

      const exercise = this.buildExercise(type, word, nativeLanguage, distractorPool);
      if (exercise) exercises.push(exercise);
    }

    return exercises;
  }

  private buildExercise(
    type: ExerciseType,
    word: WordInsightDocument,
    nativeLanguage: string,
    pool: WordInsightDocument[],
  ): Exercise | null {
    if (type === 'word_meaning') return this.buildWordMeaning(word, nativeLanguage, pool);
    if (type === 'reverse_translation') return this.buildReverseTranslation(word, nativeLanguage, pool);
    if (type === 'word_to_image') return this.buildWordToImage(word, pool);
    return null;
  }

  private buildWordMeaning(
    word: WordInsightDocument,
    nativeLanguage: string,
    pool: WordInsightDocument[],
  ): Exercise | null {
    const correct = word.translations.find((t) => t.language === nativeLanguage);
    if (!correct) return null;

    const distractors = pool
      .map((w) => w.translations.find((t) => t.language === nativeLanguage)?.text)
      .filter((t): t is string => !!t && t !== correct.text)
      .slice(0, OPTION_COUNT - 1);

    if (distractors.length < OPTION_COUNT - 1) return null;

    const correctId = randomUUID();
    const options: ExerciseOption[] = shuffle([
      { id: correctId, text: correct.text },
      ...distractors.map((t) => ({ id: randomUUID(), text: t })),
    ], this.random);

    return {
      id: randomUUID(),
      type: 'word_meaning',
      wordInsightId: word._id as Types.ObjectId,
      word: word.word,
      prompt: `What does "${word.word}" mean?`,
      options,
      correctOptionId: correctId,
      answeredAt: null,
    };
  }

  private buildReverseTranslation(
    word: WordInsightDocument,
    nativeLanguage: string,
    pool: WordInsightDocument[],
  ): Exercise | null {
    const translation = word.translations.find((t) => t.language === nativeLanguage);
    if (!translation) return null;

    const distractorWords = pool
      .filter((w) => w.word !== word.word)
      .slice(0, OPTION_COUNT - 1)
      .map((w) => w.word);

    if (distractorWords.length < OPTION_COUNT - 1) return null;

    const correctId = randomUUID();
    const options: ExerciseOption[] = shuffle([
      { id: correctId, text: word.word },
      ...distractorWords.map((w) => ({ id: randomUUID(), text: w })),
    ], this.random);

    return {
      id: randomUUID(),
      type: 'reverse_translation',
      wordInsightId: word._id as Types.ObjectId,
      word: word.word,
      prompt: `Which word means "${translation.text}"?`,
      options,
      correctOptionId: correctId,
      answeredAt: null,
    };
  }

  private buildWordToImage(word: WordInsightDocument, pool: WordInsightDocument[]): Exercise | null {
    if (word.imageRefs.length === 0) return null;

    const distractorImages = pool
      .filter((w) => w.imageRefs.length > 0 && String(w._id) !== String(word._id))
      .slice(0, OPTION_COUNT - 1)
      .map((w) => w.imageRefs[0]);

    if (distractorImages.length < OPTION_COUNT - 1) return null;

    const correctId = randomUUID();
    const correctImage = word.imageRefs[0];
    const options: ExerciseOption[] = shuffle([
      { id: correctId, text: correctImage.alt ?? word.word, imageUrl: correctImage.url },
      ...distractorImages.map((img) => ({ id: randomUUID(), text: img.alt ?? '', imageUrl: img.url })),
    ], this.random);

    return {
      id: randomUUID(),
      type: 'word_to_image',
      wordInsightId: word._id as Types.ObjectId,
      word: word.word,
      prompt: `Which image represents "${word.word}"?`,
      options,
      correctOptionId: correctId,
      answeredAt: null,
    };
  }
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
