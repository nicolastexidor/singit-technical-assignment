import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SubmitAttemptDto {
  @ApiProperty({ description: 'The user submitting the answer' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'The option ID the user selected' })
  @IsString()
  answer: string;
}
