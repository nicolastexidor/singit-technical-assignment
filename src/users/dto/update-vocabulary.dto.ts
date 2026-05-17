import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VocabStatus } from '../schemas/user-vocabulary.schema';

export class UpdateVocabularyDto {
  @ApiProperty({ enum: ['unknown', 'learning', 'known', 'ignored'] })
  @IsEnum(['unknown', 'learning', 'known', 'ignored'])
  status: VocabStatus;
}

export class GetUserInsightsQueryDto {
  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ enum: ['unknown', 'learning', 'known', 'ignored'] })
  @IsEnum(['unknown', 'learning', 'known', 'ignored'])
  @IsOptional()
  status?: VocabStatus;
}
