import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VocabStatus } from '../schemas/user-vocabulary.schema';
import { VOCAB_STATUSES } from '../../common/constants';

export class UpdateVocabularyDto {
  @ApiProperty({ enum: VOCAB_STATUSES })
  @IsEnum(VOCAB_STATUSES)
  status: VocabStatus;
}

export class GetUserInsightsQueryDto {
  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ enum: VOCAB_STATUSES })
  @IsEnum(VOCAB_STATUSES)
  @IsOptional()
  status?: VocabStatus;
}
