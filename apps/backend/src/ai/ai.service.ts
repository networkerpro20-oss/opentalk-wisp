import { Injectable, Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import OpenAI from 'openai';

export interface SentimentAnalysisResult {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number; // -1 a 1
  confidence: number; // 0 a 1
  emotions: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    interest?: number;
  };
}

export interface LeadScoringResult {
  score: number; // 0 a 100
  category: 'HOT' | 'WARM' | 'COLD';
  factors: {
    engagement: number;
    sentiment: number;
    responseTime: number;
    messageFrequency: number;
    dealPotential: number;
  };
  recommendation: string;
}

export interface AutoResponseResult {
  response: string;
  confidence: number;
  suggestedActions?: string[];
  needsHumanReview: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => KnowledgeBaseService))
    private knowledgeBaseService?: KnowledgeBaseService,
  ) {
    // Inicializar OpenAI solo si hay API key
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      this.logger.warn('OpenAI API key not found. AI features will use fallback methods.');
    }
  }

  /**
   * Analizar sentimiento de un mensaje
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    try {
      if (!this.openai) {
        return this.fallbackSentimentAnalysis(text);
      }

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en análisis de sentimientos. Analiza el texto y responde en formato JSON con:
{
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "score": número entre -1 y 1,
  "confidence": número entre 0 y 1,
  "emotions": {
    "joy": 0-1,
    "sadness": 0-1,
    "anger": 0-1,
    "fear": 0-1,
    "interest": 0-1
  }
}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      this.logger.error('Error analyzing sentiment with OpenAI:', error);
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Análisis de sentimiento fallback (sin IA)
   */
  private fallbackSentimentAnalysis(text: string): SentimentAnalysisResult {
    const lowerText = text.toLowerCase();
    
    // Palabras positivas en español
    const positiveWords = ['gracias', 'excelente', 'perfecto', 'bueno', 'genial', 'feliz', 
                          'contento', 'satisfecho', 'bien', 'sí', 'claro', 'fantástico'];
    
    // Palabras negativas en español
    const negativeWords = ['mal', 'malo', 'terrible', 'horrible', 'problema', 'error',
                          'molesto', 'enojado', 'triste', 'no', 'nunca', 'pésimo'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    const totalCount = positiveCount + negativeCount;
    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    let score = 0;

    if (totalCount > 0) {
      score = (positiveCount - negativeCount) / totalCount;
      if (score > 0.2) sentiment = 'POSITIVE';
      else if (score < -0.2) sentiment = 'NEGATIVE';
    }

    return {
      sentiment,
      score,
      confidence: totalCount > 0 ? 0.6 : 0.3,
      emotions: {
        joy: positiveCount > 0 ? 0.5 : 0.1,
        sadness: negativeCount > 0 ? 0.5 : 0.1,
        anger: lowerText.includes('enojado') || lowerText.includes('molesto') ? 0.7 : 0.1,
        fear: 0.1,
        interest: 0.5,
      },
    };
  }

  /**
   * Calcular score de lead basado en interacciones
   */
  async calculateLeadScore(contactId: string): Promise<LeadScoringResult> {
    try {
      // Obtener historial del contacto
      const contact = await this.prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          conversations: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 50,
              },
            },
          },
          deals: true,
        },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // Factores de scoring
      const factors = {
        engagement: 0,
        sentiment: 0,
        responseTime: 0,
        messageFrequency: 0,
        dealPotential: 0,
      };

      // 1. Engagement (cantidad de mensajes)
      const totalMessages = contact.conversations.reduce(
        (sum, conv) => sum + conv.messages.length,
        0,
      );
      factors.engagement = Math.min(totalMessages / 20, 1) * 20; // Max 20 puntos

      // 2. Sentiment (analizar últimos mensajes)
      const recentMessages = contact.conversations
        .flatMap(conv => conv.messages)
        .filter(msg => msg.direction === 'INBOUND')
        .slice(0, 10);

      if (recentMessages.length > 0) {
        const sentiments = await Promise.all(
          recentMessages.map(msg => this.analyzeSentiment(msg.content)),
        );
        const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
        factors.sentiment = ((avgSentiment + 1) / 2) * 20; // Convertir -1..1 a 0..20
      }

      // 3. Response time (qué tan rápido responde)
      const messageTimes = contact.conversations
        .flatMap(conv => conv.messages)
        .map(msg => msg.createdAt.getTime());

      if (messageTimes.length > 1) {
        const avgTimeBetweenMessages = messageTimes.reduce((sum, time, i) => {
          if (i === 0) return sum;
          return sum + (messageTimes[i - 1] - time);
        }, 0) / (messageTimes.length - 1);

        // Menos de 1 hora = 20 puntos, más de 24h = 0 puntos
        const hoursResponse = avgTimeBetweenMessages / (1000 * 60 * 60);
        factors.responseTime = Math.max(0, 20 - (hoursResponse / 24) * 20);
      }

      // 4. Message frequency (frecuencia de mensajes)
      const daysSinceFirstMessage = contact.conversations[0]?.messages[0]
        ? (Date.now() - contact.conversations[0].messages[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
        : 1;
      const messagesPerDay = totalMessages / daysSinceFirstMessage;
      factors.messageFrequency = Math.min(messagesPerDay * 5, 20); // Max 20 puntos

      // 5. Deal potential (tiene deals abiertos)
      const openDeals = contact.deals.filter(deal => deal.status !== 'WON' && deal.status !== 'LOST');
      const totalDealValue = openDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
      factors.dealPotential = Math.min((totalDealValue / 1000) * 10, 20); // $1000 = 10 puntos

      // Calcular score total (0-100)
      const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);

      // Categorizar
      let category: 'HOT' | 'WARM' | 'COLD';
      if (totalScore >= 70) category = 'HOT';
      else if (totalScore >= 40) category = 'WARM';
      else category = 'COLD';

      // Recomendación
      let recommendation = '';
      if (category === 'HOT') {
        recommendation = 'Contactar inmediatamente. Alta probabilidad de conversión.';
      } else if (category === 'WARM') {
        recommendation = 'Mantener comunicación regular. Potencial medio.';
      } else {
        recommendation = 'Requiere nurturing. Enviar contenido de valor.';
      }

      return {
        score: Math.round(totalScore),
        category,
        factors,
        recommendation,
      };
    } catch (error) {
      this.logger.error('Error calculating lead score:', error);
      throw error;
    }
  }

  /**
   * Generar respuesta automática inteligente (KB-aware)
   */
  async generateAutoResponse(
    messageText: string,
    conversationContext?: string[],
    organizationId?: string,
  ): Promise<AutoResponseResult> {
    try {
      if (!this.openai) {
        return this.fallbackAutoResponse(messageText);
      }

      const contextMessages = conversationContext?.slice(-5) || [];
      const context = contextMessages.join('\n');

      // Build KB-aware prompt if organizationId provided
      let kbContext = '';
      let personalityInstruction = '';
      let customSystemPrompt = '';
      let confidenceThreshold = 0.7;
      let openaiClient = this.openai;

      if (organizationId && this.knowledgeBaseService) {
        const kbData = await this.knowledgeBaseService.buildKBContext(messageText, organizationId);
        if (kbData) {
          confidenceThreshold = kbData.confidenceThreshold;
          if (kbData.context) {
            kbContext = `\n\nBase de Conocimiento del negocio (usa esta informacion para responder):\n${kbData.context}`;
          }
          if (kbData.systemPrompt) {
            customSystemPrompt = `\n\nInstrucciones del negocio: ${kbData.systemPrompt}`;
          }
          personalityInstruction = this.getPersonalityInstruction(kbData.personality);

          // Check for custom API key
          const kb = await this.prisma.knowledgeBase.findUnique({
            where: { organizationId },
            select: { customApiKey: true },
          });
          if (kb?.customApiKey) {
            openaiClient = new OpenAI({ apiKey: kb.customApiKey });
          }
        }
      }

      const systemPrompt = `${personalityInstruction || 'Eres un asistente virtual de atencion al cliente.'}
${customSystemPrompt}
${kbContext}

Tu objetivo es:
1. Responder preguntas usando la base de conocimiento cuando sea relevante
2. Ser util y profesional
3. Capturar informacion del cliente si es apropiado
4. Si no tienes informacion suficiente para responder, indica baja confianza

Contexto de la conversacion anterior:
${context}

Responde en formato JSON:
{
  "response": "tu respuesta al cliente",
  "confidence": 0-1,
  "suggestedActions": ["accion1", "accion2"],
  "needsHumanReview": true/false
}`;

      const completion = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageText },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      // Apply confidence threshold from KB config
      if (result.confidence < confidenceThreshold) {
        result.needsHumanReview = true;
      }

      return result;
    } catch (error) {
      this.logger.error('Error generating auto response with OpenAI:', error);
      return this.fallbackAutoResponse(messageText);
    }
  }

  /**
   * Get personality-specific system instruction
   */
  private getPersonalityInstruction(personality: string): string {
    const personalities: Record<string, string> = {
      PROFESSIONAL: 'Eres un asistente virtual profesional y formal. Usa un tono corporativo, claro y respetuoso.',
      FRIENDLY: 'Eres un asistente virtual amigable y cercano. Usa un tono casual pero respetuoso, con calidez.',
      AGGRESSIVE: 'Eres un asistente de ventas proactivo y persuasivo. Busca cerrar ventas y generar urgencia de forma etica.',
      EDUCATIONAL: 'Eres un asistente educativo y paciente. Explica con detalle, usa ejemplos y guia al usuario paso a paso.',
    };
    return personalities[personality] || personalities.PROFESSIONAL;
  }

  /**
   * Respuesta automática fallback (sin IA)
   */
  private fallbackAutoResponse(messageText: string): AutoResponseResult {
    const lowerText = messageText.toLowerCase();

    // Respuestas predefinidas
    if (lowerText.includes('precio') || lowerText.includes('cuánto') || lowerText.includes('costo')) {
      return {
        response: 'Gracias por tu interés. Te compartiré información sobre nuestros precios. ¿Podrías decirme qué servicio específico te interesa?',
        confidence: 0.8,
        suggestedActions: ['Enviar catálogo de precios', 'Agendar llamada'],
        needsHumanReview: false,
      };
    }

    if (lowerText.includes('horario') || lowerText.includes('hora')) {
      return {
        response: 'Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 6:00 PM. ¿En qué puedo ayudarte?',
        confidence: 0.9,
        suggestedActions: [],
        needsHumanReview: false,
      };
    }

    if (lowerText.includes('hola') || lowerText.includes('buenos') || lowerText.includes('buenas')) {
      return {
        response: '¡Hola! Bienvenido/a. Soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
        confidence: 0.9,
        suggestedActions: ['Capturar nombre'],
        needsHumanReview: false,
      };
    }

    // Respuesta genérica
    return {
      response: 'Gracias por tu mensaje. Un agente revisará tu consulta y te responderá pronto.',
      confidence: 0.5,
      suggestedActions: ['Asignar a agente humano'],
      needsHumanReview: true,
    };
  }

  /**
   * Extraer información de contacto de un mensaje (NER)
   */
  async extractContactInfo(text: string): Promise<{
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  }> {
    const info: any = {};

    // Regex para email
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailRegex);
    if (emails) info.email = emails[0];

    // Regex para teléfono
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones) info.phone = phones[0];

    // Intentar extraer nombre (después de "soy", "me llamo", "mi nombre es")
    const nameRegex = /(soy|me llamo|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch) info.name = nameMatch[2];

    return info;
  }
}
