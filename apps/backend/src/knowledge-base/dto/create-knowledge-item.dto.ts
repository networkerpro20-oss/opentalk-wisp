import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray, Min, Max } from 'class-validator';

export class CreateKnowledgeItemDto {
  @ApiProperty({ example: 'Horarios de atencion' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Nuestro horario es de Lunes a Viernes de 9:00 AM a 6:00 PM' })
  @IsString()
  content: string;

  @ApiProperty({ required: false, example: 'FAQ' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ default: 5, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number;

  @ApiProperty({ required: false, example: ['horario', 'atencion', 'disponibilidad'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}

export class GenerateFromUrlDto {
  @ApiProperty({ example: 'https://miempresa.com/servicios' })
  @IsString()
  url: string;
}

export class GenerateFromWizardDto {
  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'Venta de software CRM' })
  @IsString()
  mainActivity: string;

  @ApiProperty({ required: false, example: 'Plan Basico $99/mes, Plan Pro $299/mes' })
  @IsString()
  @IsOptional()
  servicesAndPricing?: string;

  @ApiProperty({ required: false, example: 'Lunes a Viernes 9am - 6pm' })
  @IsString()
  @IsOptional()
  operatingHours?: string;

  @ApiProperty({ required: false, example: 'Ciudad de Mexico, Mexico' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false, example: 'Si, ofrecemos prueba gratuita de 14 dias' })
  @IsString()
  @IsOptional()
  frequentQuestions?: string;

  @ApiProperty({ required: false, example: 'Soporte 24/7, integracion con WhatsApp' })
  @IsString()
  @IsOptional()
  differentiators?: string;

  @ApiProperty({ required: false, example: 'Reembolso dentro de 30 dias' })
  @IsString()
  @IsOptional()
  policies?: string;

  @ApiProperty({ required: false, example: '10 anos en el mercado, +500 clientes' })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiProperty({ required: false, example: 'WhatsApp: +52 55 1234 5678, Email: info@empresa.com' })
  @IsString()
  @IsOptional()
  contactMethods?: string;
}
