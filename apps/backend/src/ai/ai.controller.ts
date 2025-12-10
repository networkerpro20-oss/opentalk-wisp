import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AnalyzeSentimentDto } from './dto/analyze-sentiment.dto';
import { GenerateResponseDto } from './dto/generate-response.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('sentiment')
  @ApiOperation({ summary: 'Analizar sentimiento de un texto' })
  async analyzeSentiment(@Body() dto: AnalyzeSentimentDto) {
    return this.aiService.analyzeSentiment(dto.text);
  }

  @Get('lead-score/:contactId')
  @ApiOperation({ summary: 'Calcular lead score de un contacto' })
  async calculateLeadScore(@Param('contactId') contactId: string) {
    return this.aiService.calculateLeadScore(contactId);
  }

  @Post('auto-response')
  @ApiOperation({ summary: 'Generar respuesta automática inteligente' })
  async generateAutoResponse(@Body() dto: GenerateResponseDto) {
    return this.aiService.generateAutoResponse(dto.messageText, dto.context);
  }

  @Post('extract-info')
  @ApiOperation({ summary: 'Extraer información de contacto de un texto' })
  async extractContactInfo(@Body() dto: AnalyzeSentimentDto) {
    return this.aiService.extractContactInfo(dto.text);
  }
}
