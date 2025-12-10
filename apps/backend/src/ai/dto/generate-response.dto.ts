import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateResponseDto {
  @ApiProperty({ description: 'Mensaje del usuario' })
  @IsString()
  @IsNotEmpty()
  messageText: string;

  @ApiProperty({ 
    description: 'Contexto de la conversación (mensajes anteriores)',
    required: false,
    type: [String]
  })
  @IsArray()
  @IsOptional()
  context?: string[];
}
