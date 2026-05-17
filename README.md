# Vocab Practice API

NestJS + TypeScript + MongoDB backend for music-based English vocabulary practice.

## Quick Start

### 1. Requirements

- Node.js 18+
- MongoDB on `localhost:27017` — start it with:

```bash
docker compose up -d
```

> **If No Docker Desktop** Use Colima as a fallback:
> ```bash
> colima start
> docker run -d --name vocab_mongo -p 27017:27017 -v vocab_mongo_data:/data/db mongo:7.0
> ```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Default values work out of the box. Edit `.env` to override:

```
MONGO_URI=mongodb://localhost:27017/vocab_practice
PORT=8080
```

### 4. Seed the database

```bash
npm run seed
```

Seeds 20 English word insights and vocabulary state for 3 test users:

| User | Profile |
|------|---------|
| `user_001` | Intermediate — mix of known, learning, and unknown words |
| `user_002` | Beginner — only a couple of words seen, rest unseen |
| `user_003` | Advanced — most words known, a few still in progress |

### 5. Start the server

```bash
npm run start:dev
```

Server: `http://localhost:8080`
Swagger UI: `http://localhost:8080/api-docs`

---

## API Overview

All endpoints are documented and interactively testable via Swagger UI at `/api-docs`.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/insights/import` | Import or upsert word insights |
| `GET` | `/insights` | List global insights (filters + pagination) |
| `GET` | `/insights/:id` | Get a single insight by ID |
| `GET` | `/users/:userId/insights` | User insights merged with vocab state + priority score |
| `PATCH` | `/users/:userId/vocabulary/:insightId` | Manually update a vocabulary status |
| `GET` | `/users/:userId/summary` | Vocab summary — counts by status, attempt stats, recommended words |
| `POST` | `/users/:userId/sessions` | Create a practice session with generated exercises |
| `POST` | `/sessions/:sessionId/attempts/:exerciseId` | Submit an answer for an exercise |
| `GET` | `/sessions/:sessionId/results` | Get session results and current vocabulary state |

---

## Design Decisions

### Vocabulary state transitions

Applied automatically after each exercise attempt:

| Current status | Correct answer | Incorrect answer |
|----------------|---------------|-----------------|
| `unknown` | → `learning` | stays `unknown` |
| `learning` | → `known` if correctCount ≥ 3, else stays | stays `learning` |
| `known` | stays `known` | → `learning` |
| `ignored` | unchanged | unchanged |

### Prioritization scoring

Words are ranked for practice by:

```
score = statusWeight + (frequency × 0.1) − recencyPenalty

statusWeight:   unknown=3, learning=2, known=0, ignored=−10
recencyPenalty: min(hoursSinceLastPracticed / 24, 1.0)
```

Unknown and learning words always surface before known ones. High-frequency words break ties. Recently practiced words are briefly deprioritized.

### Exercise types

- **`word_meaning`**: show the word → pick the correct translation (4 options)
- **`reverse_translation`**: show a translation → pick the correct source word (4 options)
- **`word_to_image`**: show the word → pick the correct image (4 options)

Translation exercises are only generated when the requested `translationLanguage` exists on the insight. Image exercises require at least 4 words with `imageRefs` in the distractor pool. Distractors are drawn from other insights in the same language, sorted by frequency.

### Sessions

Exercises are embedded inside the `practice_sessions` document — they are always accessed through their session and never queried independently.

### Missing translations

If a word has no translation in the requested `translationLanguage`, translation-based exercises are skipped for that word. The API returns `400` if this results in zero buildable exercises for the entire session.

---

## Project Structure

```
src/
  insights/
    schemas/word-insight.schema.ts
    dto/                            — import + query DTOs
    insights.service.ts
    insights.controller.ts
    insights.module.ts
  users/
    schemas/user-vocabulary.schema.ts
    dto/                            — update vocabulary + query DTOs
    users.service.ts                — vocab state, priority scoring, summary
    users.controller.ts
    users.module.ts
  sessions/
    schemas/practice-session.schema.ts
    schemas/exercise-attempt.schema.ts
    dto/                            — create session + submit attempt DTOs
    exercise.service.ts             — word selection + exercise generation
    sessions.service.ts
    sessions.controller.ts
    sessions.module.ts
  app.module.ts
  main.ts
seed/seed.ts                        — seeds 20 insights + 3 users
docker-compose.yml                  — MongoDB container (alternative to docker run)
```
