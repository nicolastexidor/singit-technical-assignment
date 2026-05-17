import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TranslationDto {
  @ApiProperty({ example: 'es' })
  @IsString()
  language: string;

  @ApiProperty({ example: 'cariño' })
  @IsString()
  text: string;
}

export class SongRefDto {
  @ApiProperty({ example: 'song_001' })
  @IsString()
  songId: string;

  @ApiProperty({ example: 'Perfect' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  occurrences?: number;
}

export class ImageRefDto {
  @ApiProperty({ example: 'img_001' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'https://example.com/image.png' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'A heart symbol' })
  @IsString()
  @IsOptional()
  alt?: string;
}

export class ExampleDto {
  @ApiProperty({ example: 'Darling, just dive right in' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  @IsOptional()
  translations?: TranslationDto[];
}

export class WordInsightInputDto {
  @ApiProperty({ example: 'darling' })
  @IsString()
  word: string;

  @ApiProperty({ example: 'darling' })
  @IsString()
  normalizedWord: string;

  @ApiProperty({ example: 'en' })
  @IsString()
  language: string;

  @ApiProperty({ example: 0.3, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  difficulty: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  frequency: number;

  @ApiProperty({ example: 'song' })
  @IsString()
  source: string;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  @IsOptional()
  translations?: TranslationDto[];

  @ApiPropertyOptional({ type: [SongRefDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongRefDto)
  @IsOptional()
  songRefs?: SongRefDto[];

  @ApiPropertyOptional({ type: [ImageRefDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageRefDto)
  @IsOptional()
  imageRefs?: ImageRefDto[];

  @ApiPropertyOptional({ type: [ExampleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  @IsOptional()
  examples?: ExampleDto[];
}

export class ImportInsightsDto {
  @ApiProperty({ type: [WordInsightInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WordInsightInputDto)
  wordInsights: WordInsightInputDto[];
}
