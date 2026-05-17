import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/vocab_practice';

const wordInsights = [
  {
    word: 'darling', normalizedWord: 'darling', language: 'en',
    translations: [{ language: 'es', text: 'cariño' }, { language: 'pt', text: 'querido' }],
    difficulty: 0.3, frequency: 12, source: 'song',
    songRefs: [{ songId: 'song_001', title: 'Perfect', occurrences: 3 }],
    imageRefs: [{ id: 'img_001', url: 'https://picsum.photos/seed/darling/200', alt: 'A person looking affectionate' }],
    examples: [{ text: 'Darling, just dive right in', translations: [{ language: 'es', text: 'Cariño, simplemente lánzate' }] }],
  },
  {
    word: 'love', normalizedWord: 'love', language: 'en',
    translations: [{ language: 'es', text: 'amor' }, { language: 'pt', text: 'amor' }],
    difficulty: 0.1, frequency: 35, source: 'song',
    songRefs: [{ songId: 'song_001', title: 'Perfect', occurrences: 5 }],
    imageRefs: [{ id: 'img_002', url: 'https://picsum.photos/seed/love/200', alt: 'A heart symbol' }],
    examples: [{ text: 'We found love in a hopeless place', translations: [{ language: 'es', text: 'Encontramos amor en un lugar sin esperanza' }] }],
  },
  {
    word: 'soul', normalizedWord: 'soul', language: 'en',
    translations: [{ language: 'es', text: 'alma' }, { language: 'pt', text: 'alma' }],
    difficulty: 0.3, frequency: 18, source: 'song',
    songRefs: [{ songId: 'song_002', title: 'Thinking Out Loud', occurrences: 2 }],
    imageRefs: [{ id: 'img_003', url: 'https://picsum.photos/seed/soul/200', alt: 'A glowing spirit' }],
    examples: [],
  },
  {
    word: 'brave', normalizedWord: 'brave', language: 'en',
    translations: [{ language: 'es', text: 'valiente' }, { language: 'pt', text: 'corajoso' }],
    difficulty: 0.3, frequency: 10, source: 'song',
    songRefs: [{ songId: 'song_003', title: 'Brave', occurrences: 4 }],
    imageRefs: [{ id: 'img_004', url: 'https://picsum.photos/seed/brave/200', alt: 'A lion' }],
    examples: [{ text: 'Say what you wanna say', translations: [{ language: 'es', text: 'Di lo que quieras decir' }] }],
  },
  {
    word: 'wonder', normalizedWord: 'wonder', language: 'en',
    translations: [{ language: 'es', text: 'asombro' }, { language: 'pt', text: 'maravilha' }],
    difficulty: 0.5, frequency: 8, source: 'song',
    songRefs: [{ songId: 'song_004', title: 'Wonder', occurrences: 2 }],
    imageRefs: [{ id: 'img_005', url: 'https://picsum.photos/seed/wonder/200', alt: 'Stars in the night sky' }],
    examples: [],
  },
  {
    word: 'faith', normalizedWord: 'faith', language: 'en',
    translations: [{ language: 'es', text: 'fe' }, { language: 'pt', text: 'fé' }],
    difficulty: 0.3, frequency: 14, source: 'song',
    songRefs: [{ songId: 'song_005', title: 'Faith', occurrences: 6 }],
    imageRefs: [{ id: 'img_006', url: 'https://picsum.photos/seed/faith/200', alt: 'A candle in the dark' }],
    examples: [{ text: 'I gotta have faith', translations: [{ language: 'es', text: 'Tengo que tener fe' }] }],
  },
  {
    word: 'glory', normalizedWord: 'glory', language: 'en',
    translations: [{ language: 'es', text: 'gloria' }, { language: 'pt', text: 'glória' }],
    difficulty: 0.5, frequency: 6, source: 'song',
    songRefs: [{ songId: 'song_006', title: 'Glory Days', occurrences: 3 }],
    imageRefs: [{ id: 'img_007', url: 'https://picsum.photos/seed/glory/200', alt: 'A golden trophy' }],
    examples: [],
  },
  {
    word: 'dream', normalizedWord: 'dream', language: 'en',
    translations: [{ language: 'es', text: 'sueño' }, { language: 'pt', text: 'sonho' }],
    difficulty: 0.1, frequency: 28, source: 'song',
    songRefs: [{ songId: 'song_007', title: 'Dream On', occurrences: 4 }],
    imageRefs: [{ id: 'img_008', url: 'https://picsum.photos/seed/dream/200', alt: 'A sleeping person with stars' }],
    examples: [{ text: 'I have a dream', translations: [{ language: 'es', text: 'Tengo un sueño' }] }],
  },
  {
    word: 'fire', normalizedWord: 'fire', language: 'en',
    translations: [{ language: 'es', text: 'fuego' }, { language: 'pt', text: 'fogo' }],
    difficulty: 0.1, frequency: 22, source: 'song',
    songRefs: [{ songId: 'song_008', title: 'Light My Fire', occurrences: 5 }],
    imageRefs: [{ id: 'img_009', url: 'https://picsum.photos/seed/fire/200', alt: 'Flames' }],
    examples: [],
  },
  {
    word: 'grace', normalizedWord: 'grace', language: 'en',
    translations: [{ language: 'es', text: 'gracia' }, { language: 'pt', text: 'graça' }],
    difficulty: 0.5, frequency: 9, source: 'song',
    songRefs: [{ songId: 'song_009', title: 'Amazing Grace', occurrences: 7 }],
    imageRefs: [{ id: 'img_010', url: 'https://picsum.photos/seed/grace/200', alt: 'A dancer in motion' }],
    examples: [{ text: 'Amazing grace, how sweet the sound', translations: [{ language: 'es', text: 'Gracia asombrosa, qué dulce el sonido' }] }],
  },
  {
    word: 'heart', normalizedWord: 'heart', language: 'en',
    translations: [{ language: 'es', text: 'corazón' }, { language: 'pt', text: 'coração' }],
    difficulty: 0.1, frequency: 40, source: 'song',
    songRefs: [{ songId: 'song_010', title: 'Heart of Gold', occurrences: 6 }],
    imageRefs: [{ id: 'img_011', url: 'https://picsum.photos/seed/heart/200', alt: 'A beating heart' }],
    examples: [{ text: "Don't go breaking my heart", translations: [{ language: 'es', text: 'No me rompas el corazón' }] }],
  },
  {
    word: 'home', normalizedWord: 'home', language: 'en',
    translations: [{ language: 'es', text: 'hogar' }, { language: 'pt', text: 'lar' }],
    difficulty: 0.1, frequency: 32, source: 'song',
    songRefs: [{ songId: 'song_011', title: 'Take Me Home', occurrences: 8 }],
    imageRefs: [{ id: 'img_012', url: 'https://picsum.photos/seed/home/200', alt: 'A cozy house' }],
    examples: [{ text: 'Take me home, country roads', translations: [{ language: 'es', text: 'Llévame a casa, caminos del campo' }] }],
  },
  {
    word: 'sky', normalizedWord: 'sky', language: 'en',
    translations: [{ language: 'es', text: 'cielo' }, { language: 'pt', text: 'céu' }],
    difficulty: 0.1, frequency: 20, source: 'song',
    songRefs: [{ songId: 'song_012', title: 'Lucy in the Sky', occurrences: 3 }],
    imageRefs: [{ id: 'img_013', url: 'https://picsum.photos/seed/sky/200', alt: 'A blue sky with clouds' }],
    examples: [],
  },
  {
    word: 'light', normalizedWord: 'light', language: 'en',
    translations: [{ language: 'es', text: 'luz' }, { language: 'pt', text: 'luz' }],
    difficulty: 0.2, frequency: 25, source: 'song',
    songRefs: [{ songId: 'song_013', title: 'Blinding Lights', occurrences: 4 }],
    imageRefs: [{ id: 'img_014', url: 'https://picsum.photos/seed/light/200', alt: 'A bright light' }],
    examples: [{ text: 'You are the light of my life', translations: [{ language: 'es', text: 'Eres la luz de mi vida' }] }],
  },
  {
    word: 'river', normalizedWord: 'river', language: 'en',
    translations: [{ language: 'es', text: 'río' }, { language: 'pt', text: 'rio' }],
    difficulty: 0.2, frequency: 11, source: 'song',
    songRefs: [{ songId: 'song_014', title: 'Ol Man River', occurrences: 5 }],
    imageRefs: [{ id: 'img_015', url: 'https://picsum.photos/seed/river/200', alt: 'A flowing river' }],
    examples: [],
  },
  {
    word: 'shadow', normalizedWord: 'shadow', language: 'en',
    translations: [{ language: 'es', text: 'sombra' }, { language: 'pt', text: 'sombra' }],
    difficulty: 0.4, frequency: 7, source: 'song',
    songRefs: [{ songId: 'song_015', title: 'Me and My Shadow', occurrences: 2 }],
    imageRefs: [{ id: 'img_016', url: 'https://picsum.photos/seed/shadow/200', alt: 'A shadow on the wall' }],
    examples: [{ text: 'Every shadow has a light behind it', translations: [{ language: 'es', text: 'Detrás de cada sombra hay una luz' }] }],
  },
  {
    word: 'storm', normalizedWord: 'storm', language: 'en',
    translations: [{ language: 'es', text: 'tormenta' }, { language: 'pt', text: 'tempestade' }],
    difficulty: 0.4, frequency: 13, source: 'song',
    songRefs: [{ songId: 'song_016', title: 'Ride the Storm', occurrences: 3 }],
    imageRefs: [],
    examples: [{ text: 'Calm before the storm', translations: [{ language: 'es', text: 'La calma antes de la tormenta' }] }],
  },
  {
    word: 'rise', normalizedWord: 'rise', language: 'en',
    translations: [{ language: 'es', text: 'alzarse' }, { language: 'pt', text: 'elevar-se' }],
    difficulty: 0.3, frequency: 16, source: 'song',
    songRefs: [{ songId: 'song_017', title: 'Rise Up', occurrences: 7 }],
    imageRefs: [],
    examples: [{ text: 'Rise up and take the power back', translations: [{ language: 'es', text: 'Levántate y recupera el poder' }] }],
  },
  {
    word: 'broken', normalizedWord: 'broken', language: 'en',
    translations: [{ language: 'es', text: 'roto' }, { language: 'pt', text: 'quebrado' }],
    difficulty: 0.2, frequency: 19, source: 'song',
    songRefs: [{ songId: 'song_018', title: 'Broken', occurrences: 4 }],
    imageRefs: [],
    examples: [{ text: "I'm broken, can you hear me?", translations: [{ language: 'es', text: 'Estoy roto, ¿puedes escucharme?' }] }],
  },
  {
    word: 'breathe', normalizedWord: 'breathe', language: 'en',
    translations: [{ language: 'es', text: 'respirar' }, { language: 'pt', text: 'respirar' }],
    difficulty: 0.2, frequency: 15, source: 'song',
    songRefs: [{ songId: 'song_019', title: 'Just Breathe', occurrences: 5 }],
    imageRefs: [],
    examples: [{ text: 'Just breathe', translations: [{ language: 'es', text: 'Solo respira' }] }],
  },
];

// ─── User vocabulary state ────────────────────────────────────────────────────
// user_001: intermediate — knows common words, still learning harder ones
// user_002: beginner — has only seen a couple words (rest are unknown/unseen)
// user_003: advanced — knows most words, only a few still in progress

const userVocabSeed: {
  userId: string;
  normalizedWord: string;
  status: 'unknown' | 'learning' | 'known' | 'ignored';
  correctCount: number;
  incorrectCount: number;
}[] = [
  // user_001 — intermediate
  { userId: 'user_001', normalizedWord: 'love',    status: 'known',    correctCount: 5, incorrectCount: 0 },
  { userId: 'user_001', normalizedWord: 'dream',   status: 'known',    correctCount: 4, incorrectCount: 1 },
  { userId: 'user_001', normalizedWord: 'heart',   status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_001', normalizedWord: 'home',    status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_001', normalizedWord: 'fire',    status: 'known',    correctCount: 3, incorrectCount: 1 },
  { userId: 'user_001', normalizedWord: 'darling', status: 'learning', correctCount: 1, incorrectCount: 2 },
  { userId: 'user_001', normalizedWord: 'brave',   status: 'learning', correctCount: 1, incorrectCount: 0 },
  { userId: 'user_001', normalizedWord: 'faith',   status: 'learning', correctCount: 0, incorrectCount: 1 },
  { userId: 'user_001', normalizedWord: 'light',   status: 'learning', correctCount: 1, incorrectCount: 1 },
  { userId: 'user_001', normalizedWord: 'glory',   status: 'unknown',  correctCount: 0, incorrectCount: 0 },
  { userId: 'user_001', normalizedWord: 'wonder',  status: 'unknown',  correctCount: 0, incorrectCount: 0 },
  { userId: 'user_001', normalizedWord: 'broken',  status: 'ignored',  correctCount: 0, incorrectCount: 0 },

  // user_002 — beginner (only a couple words seen)
  { userId: 'user_002', normalizedWord: 'love',    status: 'learning', correctCount: 1, incorrectCount: 1 },
  { userId: 'user_002', normalizedWord: 'fire',    status: 'unknown',  correctCount: 0, incorrectCount: 1 },

  // user_003 — advanced (most words known, a few still learning)
  { userId: 'user_003', normalizedWord: 'love',    status: 'known',    correctCount: 6, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'dream',   status: 'known',    correctCount: 5, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'heart',   status: 'known',    correctCount: 4, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'home',    status: 'known',    correctCount: 4, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'fire',    status: 'known',    correctCount: 4, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'sky',     status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'light',   status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'river',   status: 'known',    correctCount: 3, incorrectCount: 1 },
  { userId: 'user_003', normalizedWord: 'soul',    status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'brave',   status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'faith',   status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'grace',   status: 'known',    correctCount: 3, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'darling', status: 'learning', correctCount: 2, incorrectCount: 1 },
  { userId: 'user_003', normalizedWord: 'wonder',  status: 'learning', correctCount: 1, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'glory',   status: 'learning', correctCount: 1, incorrectCount: 1 },
  { userId: 'user_003', normalizedWord: 'shadow',  status: 'learning', correctCount: 0, incorrectCount: 1 },
  { userId: 'user_003', normalizedWord: 'storm',   status: 'unknown',  correctCount: 0, incorrectCount: 0 },
  { userId: 'user_003', normalizedWord: 'breathe', status: 'unknown',  correctCount: 0, incorrectCount: 0 },
];

// ─── Mongoose schemas (raw — no NestJS decorators needed in seed) ─────────────

const WordInsightSchema = new mongoose.Schema(
  {
    word: String, normalizedWord: String, language: String,
    translations: [{ language: String, text: String }],
    difficulty: Number, frequency: Number, source: String,
    songRefs: [{ songId: String, title: String, occurrences: Number }],
    imageRefs: [{ id: String, url: String, alt: String }],
    examples: [{ text: String, translations: [{ language: String, text: String }] }],
  },
  { timestamps: true },
);
WordInsightSchema.index({ normalizedWord: 1, language: 1 }, { unique: true });

const UserVocabularySchema = new mongoose.Schema(
  {
    userId: String, wordInsightId: mongoose.Types.ObjectId,
    normalizedWord: String, language: String,
    status: String, correctCount: Number, incorrectCount: Number,
    lastPracticedAt: Date,
  },
  { timestamps: true },
);
UserVocabularySchema.index({ userId: 1, wordInsightId: 1 }, { unique: true });

const WordInsightModel = mongoose.model('WordInsight', WordInsightSchema);
const UserVocabularyModel = mongoose.model('UserVocabulary', UserVocabularySchema);

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await WordInsightModel.deleteMany({});
  await UserVocabularyModel.deleteMany({});
  console.log('Cleared existing data');

  const inserted = await WordInsightModel.insertMany(wordInsights);
  console.log(`Inserted ${inserted.length} word insights`);

  const insightMap = new Map(inserted.map((i) => [i.get('normalizedWord') as string, i._id]));

  let vocabCount = 0;
  for (const entry of userVocabSeed) {
    const insightId = insightMap.get(entry.normalizedWord);
    if (!insightId) { console.warn(`No insight for: ${entry.normalizedWord}`); continue; }
    await UserVocabularyModel.create({
      userId: entry.userId,
      wordInsightId: insightId,
      normalizedWord: entry.normalizedWord,
      language: 'en',
      status: entry.status,
      correctCount: entry.correctCount,
      incorrectCount: entry.incorrectCount,
      lastPracticedAt: entry.correctCount > 0 || entry.incorrectCount > 0 ? new Date() : null,
    });
    vocabCount++;
  }

  console.log(`Inserted ${vocabCount} user vocabulary entries`);
  console.log('\n── Seeded users ──────────────────────────────────────');
  console.log('user_001  intermediate  (known: 5, learning: 5, unknown: 2, ignored: 1)');
  console.log('user_002  beginner      (learning: 1, unknown: 1 — rest are unseen)');
  console.log('user_003  advanced      (known: 12, learning: 4, unknown: 2)');
  console.log('──────────────────────────────────────────────────────');
  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
