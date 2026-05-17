import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { VocabStatus } from '../../users/schemas/user-vocabulary.schema';
import { ExerciseType } from '../schemas/practice-session.schema';

export class CreateSessionDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  sourceLanguage: string;

  @ApiProperty({ example: 'es' })
  @IsString()
  translationLanguage: string;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: [String],
    enum: ['unknown', 'learning', 'known', 'ignored'],
    default: ['unknown', 'learning'],
  })
  @IsArray()
  @IsEnum(['unknown', 'learning', 'known', 'ignored'], { each: true })
  @IsOptional()
  statuses?: VocabStatus[];

  @ApiPropertyOptional({
    type: [String],
    enum: ['word_meaning', 'reverse_translation', 'word_to_image'],
    default: ['word_meaning', 'reverse_translation'],
  })
  @IsArray()
  @IsEnum(['word_meaning', 'reverse_translation', 'word_to_image'], { each: true })
  @IsOptional()
  exerciseTypes?: ExerciseType[];
}
