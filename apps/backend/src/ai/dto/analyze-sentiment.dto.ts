import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeSentimentDto {
  @ApiProperty({ description: 'Texto a analizar' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
