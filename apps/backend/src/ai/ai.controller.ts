import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeSentimentDto } from './dto/analyze-sentiment.dto';
import { GenerateResponseDto } from './dto/generate-response.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Post('generate-response')
  @ApiOperation({ summary: 'Generar respuesta automatica inteligente' })
  async generateAutoResponse(@Body() dto: GenerateResponseDto) {
    let messageText = dto.messageText || '';
    let context = dto.context;

    // If conversationId is provided, fetch messages from DB
    if (dto.conversationId && !messageText) {
      const messages = await this.prisma.message.findMany({
        where: { conversationId: dto.conversationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { content: true, direction: true },
      });

      if (messages.length > 0) {
        messageText = messages[0].content;
        context = messages
          .slice(1)
          .reverse()
          .map((m) => `${m.direction === 'INBOUND' ? 'Cliente' : 'Agente'}: ${m.content}`);
      }
    }

    if (!messageText) {
      return {
        response: 'No hay mensajes para generar una respuesta.',
        confidence: 0,
        suggestedActions: [],
        needsHumanReview: true,
      };
    }

    return this.aiService.generateAutoResponse(messageText, context, dto.organizationId);
  }

  @Post('extract-info')
  @ApiOperation({ summary: 'Extraer informacion de contacto de un texto' })
  async extractContactInfo(@Body() dto: AnalyzeSentimentDto) {
    return this.aiService.extractContactInfo(dto.text);
  }
}
