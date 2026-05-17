import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PracticeSessionDocument = HydratedDocument<PracticeSession>;

export type ExerciseType = 'word_meaning' | 'reverse_translation' | 'word_to_image';
export type SessionStatus = 'active' | 'completed';

@Schema({ _id: false })
export class ExerciseOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop()
  imageUrl?: string;
}
export const ExerciseOptionSchema = SchemaFactory.createForClass(ExerciseOption);

@Schema({ _id: false })
export class Exercise {
  @Prop({ required: true })
  id: string;

  @Prop({
    type: String,
    enum: ['word_meaning', 'reverse_translation', 'word_to_image'],
    required: true,
  })
  type: ExerciseType;

  @Prop({ type: Types.ObjectId, ref: 'WordInsight', required: true })
  wordInsightId: Types.ObjectId;

  @Prop({ required: true })
  word: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ type: [ExerciseOptionSchema], required: true })
  options: ExerciseOption[];

  @Prop({ required: true })
  correctOptionId: string;

  @Prop({ type: Date, default: null })
  answeredAt: Date | null;
}
export const ExerciseSchema = SchemaFactory.createForClass(Exercise);

@Schema({ timestamps: true })
export class PracticeSession {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  sourceLanguage: string;

  @Prop({ required: true })
  translationLanguage: string;

  @Prop({ type: [ExerciseSchema], required: true })
  exercises: Exercise[];

  @Prop({ type: String, enum: ['active', 'completed'], default: 'active' })
  status: SessionStatus;
}

export const PracticeSessionSchema = SchemaFactory.createForClass(PracticeSession);

PracticeSessionSchema.index({ userId: 1, status: 1 });
PracticeSessionSchema.index({ userId: 1, createdAt: -1 });
