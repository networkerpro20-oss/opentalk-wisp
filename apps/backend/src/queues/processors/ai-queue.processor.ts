import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AiService } from '../../ai/ai.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface AiResponseJob {
  conversationId: number;
  prompt: string;
  messageContent: string;
  organizationId: number;
  useCase?: 'sentiment' | 'lead_scoring' | 'auto_response' | 'extract_info';
}

export interface SentimentAnalysisJob {
  messageId: number;
  content: string;
  organizationId: number;
}

@Processor('ai-processing')
export class AiQueueProcessor {
  private readonly logger = new Logger(AiQueueProcessor.name);

  constructor(
    private readonly aiService: AiService,
    @InjectQueue('whatsapp-messages') private whatsappQueue: Queue,
  ) {}

  @Process({
    name: 'generate-response',
    concurrency: 2, // Limitar llamadas a OpenAI
  })
  async handleAiResponse(job: Job<AiResponseJob>) {
    this.logger.log(`Generating AI response for conversation ${job.data.conversationId}`);

    try {
      const { conversationId, prompt, messageContent, organizationId } = job.data;

      await job.updateProgress(20);

      // Generar respuesta con IA
      const aiResponse = await this.aiService.generateResponse({
        prompt,
        context: messageContent,
        organizationId,
      });

      await job.updateProgress(70);

      // Agregar a cola de WhatsApp para enviar
      await this.whatsappQueue.add('send-outgoing', {
        to: job.data.conversationId, // Simplificado
        message: aiResponse.text,
        organizationId,
      }, {
        priority: 2,
      });

      await job.updateProgress(100);

      return {
        success: true,
        response: aiResponse.text,
        tokensUsed: aiResponse.tokensUsed,
      };
    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'sentiment-analysis',
    concurrency: 5,
  })
  async handleSentimentAnalysis(job: Job<SentimentAnalysisJob>) {
    this.logger.log(`Analyzing sentiment for message ${job.data.messageId}`);

    try {
      const { messageId, content, organizationId } = job.data;

      await job.updateProgress(30);

      // Analizar sentimiento
      const sentiment = await this.aiService.analyzeSentiment({
        text: content,
        organizationId,
      });

      await job.updateProgress(80);

      // Aquí podrías guardar el sentimiento en la BD
      this.logger.log(`Sentiment for message ${messageId}: ${sentiment.label} (${sentiment.score})`);

      await job.updateProgress(100);

      return {
        success: true,
        messageId,
        sentiment: sentiment.label,
        score: sentiment.score,
      };
    } catch (error) {
      this.logger.error(`Error analyzing sentiment: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'lead-scoring',
    concurrency: 3,
  })
  async handleLeadScoring(job: Job) {
    this.logger.log(`Scoring lead for contact ${job.data.contactId}`);

    try {
      const { contactId, messageHistory, organizationId } = job.data;

      await job.updateProgress(30);

      // Calcular lead score usando IA
      const leadScore = await this.aiService.scoreLeadQuality({
        contactId,
        messageHistory,
        organizationId,
      });

      await job.updateProgress(80);

      // Actualizar lead score en la BD
      this.logger.log(`Lead score for contact ${contactId}: ${leadScore.score}/100`);

      await job.updateProgress(100);

      return {
        success: true,
        contactId,
        score: leadScore.score,
        category: leadScore.category,
        insights: leadScore.insights,
      };
    } catch (error) {
      this.logger.error(`Error scoring lead: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'extract-info',
    concurrency: 4,
  })
  async handleInfoExtraction(job: Job) {
    this.logger.log(`Extracting info from message ${job.data.messageId}`);

    try {
      const { messageId, content, fieldsToExtract, organizationId } = job.data;

      await job.updateProgress(30);

      // Extraer información usando IA
      const extractedInfo = await this.aiService.extractInformation({
        text: content,
        fields: fieldsToExtract,
        organizationId,
      });

      await job.updateProgress(80);

      this.logger.log(`Extracted info from message ${messageId}: ${JSON.stringify(extractedInfo)}`);

      await job.updateProgress(100);

      return {
        success: true,
        messageId,
        extractedInfo,
      };
    } catch (error) {
      this.logger.error(`Error extracting info: ${error.message}`);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing AI job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`AI job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`AI job ${job.id} failed: ${error.message}`);
  }
}
