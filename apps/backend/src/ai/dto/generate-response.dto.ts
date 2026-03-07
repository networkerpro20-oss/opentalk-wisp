import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateResponseDto {
  @ApiProperty({ description: 'ID de la conversacion', required: false })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ description: 'Mensaje del usuario', required: false })
  @IsString()
  @IsOptional()
  messageText?: string;

  @ApiProperty({
    description: 'Contexto de la conversacion (mensajes anteriores)',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  context?: string[];

  @ApiProperty({ description: 'ID de la organizacion para KB context', required: false })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
