import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { WordInsight, WordInsightDocument } from './schemas/word-insight.schema';
import { GetInsightsQueryDto } from './dto/get-insights-query.dto';
import { WordInsightInputDto } from './dto/import-insights.dto';

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  rejected: { index: number; reason: string }[];
}

@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(WordInsight.name) private readonly model: Model<WordInsightDocument>,
  ) {}

  async importInsights(items: WordInsightInputDto[]): Promise<ImportSummary> {
    const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, rejected: [] };

    for (let i = 0; i < items.length; i++) {
      const dto = items[i];

      const existing = await this.model
        .findOne({ normalizedWord: dto.normalizedWord, language: dto.language })
        .lean();

      if (existing) {
        const hasChanges =
          existing.word !== dto.word ||
          existing.frequency !== dto.frequency ||
          existing.difficulty !== dto.difficulty ||
          existing.source !== dto.source;

        if (!hasChanges) {
          summary.skipped++;
          continue;
        }

        await this.model.updateOne(
          { _id: existing._id },
          {
            $set: {
              word: dto.word,
              frequency: dto.frequency,
              difficulty: dto.difficulty,
              source: dto.source,
              translations: dto.translations ?? existing.translations,
              songRefs: dto.songRefs ?? existing.songRefs,
              imageRefs: dto.imageRefs ?? existing.imageRefs,
              examples: dto.examples ?? existing.examples,
            },
          },
        );
        summary.updated++;
      } else {
        await this.model.create({
          word: dto.word,
          normalizedWord: dto.normalizedWord,
          language: dto.language,
          translations: dto.translations ?? [],
          difficulty: dto.difficulty,
          frequency: dto.frequency,
          source: dto.source,
          songRefs: dto.songRefs ?? [],
          imageRefs: dto.imageRefs ?? [],
          examples: dto.examples ?? [],
        });
        summary.created++;
      }
    }

    return summary;
  }

  async findAll(query: GetInsightsQueryDto) {
    const filter: FilterQuery<WordInsightDocument> = {};

    if (query.language) filter.language = query.language;
    if (query.source) filter.source = query.source;
    if (query.difficulty !== undefined) filter.difficulty = query.difficulty;
    if (query.normalizedWord) filter.normalizedWord = new RegExp(query.normalizedWord, 'i');

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ frequency: -1 }).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.model.findById(id).lean();
  }
}
