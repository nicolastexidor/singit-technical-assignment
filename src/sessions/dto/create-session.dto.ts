import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { VocabStatus } from '../../users/schemas/user-vocabulary.schema';
import { ExerciseType } from '../schemas/practice-session.schema';
import { VOCAB_STATUSES, EXERCISE_TYPES } from '../../common/constants';

export class CreateSessionDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  learningLanguage: string;

  @ApiProperty({ example: 'es' })
  @IsString()
  nativeLanguage: string;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: [String],
    enum: VOCAB_STATUSES,
    default: ['unknown', 'learning'],
  })
  @IsArray()
  @IsEnum(VOCAB_STATUSES, { each: true })
  @IsOptional()
  statuses?: VocabStatus[];

  @ApiPropertyOptional({
    type: [String],
    enum: EXERCISE_TYPES,
    default: ['word_meaning', 'reverse_translation'],
  })
  @IsArray()
  @IsEnum(EXERCISE_TYPES, { each: true })
  @IsOptional()
  exerciseTypes?: ExerciseType[];
}
