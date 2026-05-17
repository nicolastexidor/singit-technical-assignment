import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { VOCAB_STATUSES } from '../../common/constants';

export type UserVocabularyDocument = HydratedDocument<UserVocabulary>;

export type VocabStatus = 'unknown' | 'learning' | 'known' | 'ignored';

@Schema({ timestamps: true })
export class UserVocabulary {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'WordInsight', required: true })
  wordInsightId: Types.ObjectId;

  @Prop({ required: true })
  normalizedWord: string;

  @Prop({ required: true })
  language: string;

  @Prop({
    type: String,
    enum: VOCAB_STATUSES,
    default: 'unknown',
  })
  status: VocabStatus;

  @Prop({ default: 0 })
  correctCount: number;

  @Prop({ default: 0 })
  incorrectCount: number;

  @Prop({ type: Date, default: null })
  lastPracticedAt: Date | null;
}

export const UserVocabularySchema = SchemaFactory.createForClass(UserVocabulary);

UserVocabularySchema.index({ userId: 1, wordInsightId: 1 }, { unique: true });
UserVocabularySchema.index({ userId: 1, status: 1 });
UserVocabularySchema.index({ userId: 1, language: 1 });
UserVocabularySchema.index({ wordInsightId: 1 });
