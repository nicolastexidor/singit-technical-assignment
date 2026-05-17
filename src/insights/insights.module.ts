import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WordInsight, WordInsightSchema } from './schemas/word-insight.schema';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: WordInsight.name, schema: WordInsightSchema }])],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService, MongooseModule],
})
export class InsightsModule {}
