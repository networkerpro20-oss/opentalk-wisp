import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AiService } from '../../ai/ai.service';

interface AiResponseJob {
  conversationId: string;
  prompt: string;
  messageContent: string;
  organizationId: string;
  contactPhone?: string;
}

interface SentimentAnalysisJob {
  messageId: string;
  content: string;
  organizationId: string;
}

interface LeadScoringJob {
  contactId: string;
  organizationId: string;
}

interface InfoExtractionJob {
  messageId: string;
  content: string;
  fieldsToExtract: string[];
  organizationId: string;
}

@Processor('ai-processing')
export class AiQueueProcessor {
  private readonly logger = new Logger(AiQueueProcessor.name);

  constructor(
    private aiService: AiService,
    @InjectQueue('whatsapp-messages') private whatsappQueue: Queue,
  ) {}

  @Process({
    name: 'generate-response',
    concurrency: 2,
  })
  async handleAiResponse(job: Job<AiResponseJob>) {
    this.logger.log(`Generating AI response for conversation ${job.data.conversationId}`);

    try {
      const { conversationId, messageContent } = job.data;

      // Generar respuesta con IA
      const aiResponse = await this.aiService.generateAutoResponse(
        conversationId,
        messageContent,
      );

      this.logger.log(`AI Response generated: ${aiResponse.response.substring(0, 100)}...`);

      return {
        success: true,
        conversationId,
        response: aiResponse.response,
        confidence: aiResponse.confidence,
        needsHumanReview: aiResponse.needsHumanReview,
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
      const { messageId, content } = job.data;

      const sentiment = await this.aiService.analyzeSentiment(content);

      this.logger.log(`Sentiment: ${sentiment.sentiment} (score: ${sentiment.score})`);

      return {
        success: true,
        messageId,
        sentiment: sentiment.sentiment,
        score: sentiment.score,
        confidence: sentiment.confidence,
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
  async handleLeadScoring(job: Job<LeadScoringJob>) {
    this.logger.log(`Calculating lead score for contact ${job.data.contactId}`);

    try {
      const { contactId } = job.data;

      const leadScore = await this.aiService.calculateLeadScore(contactId);

      this.logger.log(`Lead score: ${leadScore.score}/100 (${leadScore.category})`);

      return {
        success: true,
        contactId,
        score: leadScore.score,
        category: leadScore.category,
      };
    } catch (error) {
      this.logger.error(`Error calculating lead score: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'extract-info',
    concurrency: 4,
  })
  async handleInfoExtraction(job: Job<InfoExtractionJob>) {
    this.logger.log(`Info extraction for message ${job.data.messageId}`);

    try {
      const { messageId, fieldsToExtract } = job.data;

      this.logger.log(`Requested fields: ${fieldsToExtract.join(', ')}`);
      
      return {
        success: true,
        messageId,
        note: 'Info extraction feature coming soon',
      };
    } catch (error) {
      this.logger.error(`Error extracting information: ${error.message}`);
      throw error;
    }
  }
}
