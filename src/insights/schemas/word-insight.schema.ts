import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WordInsightDocument = HydratedDocument<WordInsight>;

@Schema({ _id: false })
export class Translation {
  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  text: string;
}
export const TranslationSchema = SchemaFactory.createForClass(Translation);

@Schema({ _id: false })
export class SongRef {
  @Prop({ required: true })
  songId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: 1 })
  occurrences: number;
}
export const SongRefSchema = SchemaFactory.createForClass(SongRef);

@Schema({ _id: false })
export class ImageRef {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  alt?: string;
}
export const ImageRefSchema = SchemaFactory.createForClass(ImageRef);

@Schema({ _id: false })
export class Example {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [TranslationSchema], default: [] })
  translations: Translation[];
}
export const ExampleSchema = SchemaFactory.createForClass(Example);

@Schema({ timestamps: true })
export class WordInsight {
  @Prop({ required: true })
  word: string;

  @Prop({ required: true })
  normalizedWord: string;

  @Prop({ required: true })
  language: string;

  @Prop({ type: [TranslationSchema], default: [] })
  translations: Translation[];

  @Prop({ required: true, min: 0, max: 1 })
  difficulty: number;

  @Prop({ required: true, default: 1 })
  frequency: number;

  @Prop({ required: true })
  source: string;

  @Prop({ type: [SongRefSchema], default: [] })
  songRefs: SongRef[];

  @Prop({ type: [ImageRefSchema], default: [] })
  imageRefs: ImageRef[];

  @Prop({ type: [ExampleSchema], default: [] })
  examples: Example[];
}

export const WordInsightSchema = SchemaFactory.createForClass(WordInsight);

WordInsightSchema.index({ normalizedWord: 1, language: 1 }, { unique: true });
WordInsightSchema.index({ language: 1 });
WordInsightSchema.index({ source: 1 });
WordInsightSchema.index({ difficulty: 1 });
WordInsightSchema.index({ frequency: -1 });
