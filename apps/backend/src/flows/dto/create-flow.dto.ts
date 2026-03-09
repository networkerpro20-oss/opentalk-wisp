import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const FLOW_TRIGGERS = ['NEW_CONTACT', 'NEW_MESSAGE', 'TAG_ADDED', 'DEAL_STAGE_CHANGE'] as const;

export class CreateFlowDto {
  @ApiProperty({ description: 'Nombre del flow' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Descripción del flow', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Trigger que activa el flow',
    enum: FLOW_TRIGGERS,
  })
  @IsIn(FLOW_TRIGGERS)
  @IsNotEmpty()
  trigger: string;

  @ApiProperty({ description: 'Si el flow está activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Nodos del flow (estructura ReactFlow)', type: 'array' })
  @IsArray()
  @IsOptional()
  nodes?: any[];

  @ApiProperty({ description: 'Conexiones entre nodos', type: 'array' })
  @IsArray()
  @IsOptional()
  edges?: any[];
}
