import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { WordInsight, WordInsightDocument } from '../insights/schemas/word-insight.schema';
import { UserVocabulary, UserVocabularyDocument, VocabStatus } from '../users/schemas/user-vocabulary.schema';
import { Exercise, ExerciseOption, ExerciseType } from './schemas/practice-session.schema';

const STATUS_WEIGHT: Record<VocabStatus, number> = {
  unknown: 3,
  learning: 2,
  known: 0,
  ignored: -10,
};

function score(status: VocabStatus, frequency: number, lastPracticedAt: Date | null): number {
  const recencyPenalty = lastPracticedAt
    ? Math.min((Date.now() - lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24), 1.0)
    : 0;
  return STATUS_WEIGHT[status] + frequency * 0.1 - recencyPenalty;
}

const OPTION_COUNT = 4;

export interface SelectWordsParams {
  userId: string;
  sourceLanguage: string;
  limit: number;
  statuses: VocabStatus[];
}

@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(WordInsight.name) private readonly insightModel: Model<WordInsightDocument>,
    @InjectModel(UserVocabulary.name) private readonly vocabModel: Model<UserVocabularyDocument>,
  ) {}

  async selectWords(params: SelectWordsParams): Promise<WordInsightDocument[]> {
    const vocabEntries = await this.vocabModel
      .find({ userId: params.userId, language: params.sourceLanguage, status: { $in: params.statuses } })
      .lean();

    const vocabMap = new Map(vocabEntries.map((v) => [String(v.wordInsightId), v]));

    let candidates: WordInsightDocument[] = [];

    if (vocabEntries.length > 0) {
      candidates = await this.insightModel
        .find({ _id: { $in: vocabEntries.map((v) => v.wordInsightId) }, language: params.sourceLanguage })
        .lean() as unknown as WordInsightDocument[];
    }

    if (params.statuses.includes('unknown') && candidates.length < params.limit) {
      const seenIds = new Set(vocabEntries.map((v) => String(v.wordInsightId)));
      const unseen = await this.insightModel
        .find({
          _id: { $nin: [...seenIds].map((id) => new Types.ObjectId(id)) },
          language: params.sourceLanguage,
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
        score(vb?.status ?? 'unknown', b.frequency, vb?.lastPracticedAt ?? null) -
        score(va?.status ?? 'unknown', a.frequency, va?.lastPracticedAt ?? null)
      );
    });

    return candidates.slice(0, params.limit);
  }

  async buildExercises(
    words: WordInsightDocument[],
    translationLanguage: string,
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
      .lean() as unknown as WordInsightDocument[];

    const exercises: Exercise[] = [];
    let typeIndex = 0;

    for (const word of words) {
      const translation = word.translations.find((t) => t.language === translationLanguage);
      const availableTypes = exerciseTypes.filter((t) => {
        if ((t === 'word_meaning' || t === 'reverse_translation' || t === 'translation_match') && !translation) return false;
        if (t === 'word_to_image' && word.imageRefs.length === 0) return false;
        return true;
      });

      if (availableTypes.length === 0) continue;

      const type = availableTypes[typeIndex % availableTypes.length];
      typeIndex++;

      const exercise = this.buildExercise(type, word, translationLanguage, distractorPool);
      if (exercise) exercises.push(exercise);
    }

    return exercises;
  }

  private buildExercise(
    type: ExerciseType,
    word: WordInsightDocument,
    translationLanguage: string,
    pool: WordInsightDocument[],
  ): Exercise | null {
    if (type === 'word_meaning') return this.buildWordMeaning(word, translationLanguage, pool);
    if (type === 'reverse_translation') return this.buildReverseTranslation(word, translationLanguage, pool);
    if (type === 'word_to_image') return this.buildWordToImage(word, pool);
    if (type === 'translation_match') return this.buildTranslationMatch(word, translationLanguage, pool);
    return null;
  }

  private buildWordMeaning(
    word: WordInsightDocument,
    translationLanguage: string,
    pool: WordInsightDocument[],
  ): Exercise | null {
    const correct = word.translations.find((t) => t.language === translationLanguage);
    if (!correct) return null;

    const distractors = pool
      .map((w) => w.translations.find((t) => t.language === translationLanguage)?.text)
      .filter((t): t is string => !!t && t !== correct.text)
      .slice(0, OPTION_COUNT - 1);

    if (distractors.length < OPTION_COUNT - 1) return null;

    const correctId = randomUUID();
    const options: ExerciseOption[] = shuffle([
      { id: correctId, text: correct.text },
      ...distractors.map((t) => ({ id: randomUUID(), text: t })),
    ]);

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
    translationLanguage: string,
    pool: WordInsightDocument[],
  ): Exercise | null {
    const translation = word.translations.find((t) => t.language === translationLanguage);
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
    ]);

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

  private buildTranslationMatch(
    word: WordInsightDocument,
    translationLanguage: string,
    pool: WordInsightDocument[],
  ): Exercise | null {
    const correct = word.translations.find((t) => t.language === translationLanguage);
    if (!correct) return null;

    const distractorTranslations = pool
      .map((w) => w.translations.find((t) => t.language === translationLanguage)?.text)
      .filter((t): t is string => !!t && t !== correct.text)
      .slice(0, OPTION_COUNT - 1);

    if (distractorTranslations.length < OPTION_COUNT - 1) return null;

    const correctId = randomUUID();
    const options: ExerciseOption[] = shuffle([
      { id: correctId, text: `${word.word} → ${correct.text}` },
      ...distractorTranslations.map((t) => ({ id: randomUUID(), text: `${word.word} → ${t}` })),
    ]);

    return {
      id: randomUUID(),
      type: 'translation_match',
      wordInsightId: word._id as Types.ObjectId,
      word: word.word,
      prompt: `Which option correctly pairs "${word.word}" with its translation?`,
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
    ]);

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

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
