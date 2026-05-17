import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ExerciseType } from './practice-session.schema';

export type ExerciseAttemptDocument = HydratedDocument<ExerciseAttempt>;

@Schema({ timestamps: true })
export class ExerciseAttempt {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'PracticeSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ required: true })
  exerciseId: string;

  @Prop({ type: Types.ObjectId, ref: 'WordInsight', required: true })
  wordInsightId: Types.ObjectId;

  @Prop({ required: true })
  word: string;

  @Prop({
    type: String,
    enum: ['word_meaning', 'reverse_translation', 'word_to_image', 'translation_match'],
    required: true,
  })
  exerciseType: ExerciseType;

  @Prop({ required: true })
  answer: string;

  @Prop({ required: true })
  isCorrect: boolean;
}

export const ExerciseAttemptSchema = SchemaFactory.createForClass(ExerciseAttempt);

ExerciseAttemptSchema.index({ userId: 1, wordInsightId: 1 });
ExerciseAttemptSchema.index({ sessionId: 1 });
ExerciseAttemptSchema.index({ userId: 1, createdAt: -1 });
