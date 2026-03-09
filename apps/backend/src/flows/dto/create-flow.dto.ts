import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FlowTrigger {
  NEW_CONTACT = 'NEW_CONTACT',
  NEW_MESSAGE = 'NEW_MESSAGE',
  TAG_ADDED = 'TAG_ADDED',
  DEAL_STAGE_CHANGE = 'DEAL_STAGE_CHANGE',
}

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
    enum: FlowTrigger,
  })
  @IsEnum(FlowTrigger, {
    message: `trigger must be one of: ${Object.values(FlowTrigger).join(', ')}`,
  })
  @IsNotEmpty()
  trigger: FlowTrigger;

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
