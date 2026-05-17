export const VOCAB_STATUSES = ['unknown', 'learning', 'known', 'ignored'] as const;
export const EXERCISE_TYPES = ['word_meaning', 'reverse_translation', 'word_to_image'] as const;

export const STATUS_WEIGHT = {
  unknown: 3,
  learning: 2,
  known: 0,
  ignored: -10,
} as const;
