import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { MessagesService } from '../../messages/messages.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface IncomingMessageJob {
  from: string;
  message: any;
  timestamp: number;
  organizationId: number;
  sessionId?: string;
}

export interface OutgoingMessageJob {
  to: string;
  message: string;
  messageId?: number;
  organizationId: number;
  sessionId?: string;
  mediaUrl?: string;
}

@Processor('whatsapp-messages')
export class WhatsappQueueProcessor {
  private readonly logger = new Logger(WhatsappQueueProcessor.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly messagesService: MessagesService,
    @InjectQueue('media-processing') private mediaQueue: Queue,
    @InjectQueue('flow-execution') private flowQueue: Queue,
  ) {}

  @Process({
    name: 'process-incoming',
    concurrency: 5, // Procesar 5 mensajes simultáneamente
  })
  async handleIncomingMessage(job: Job<IncomingMessageJob>) {
    this.logger.log(`Processing incoming message from ${job.data.from}`);

    try {
      const { from, message, timestamp, organizationId, sessionId } = job.data;

      // 1. Guardar mensaje en base de datos
      const savedMessage = await this.messagesService.create({
        from,
        content: message.conversation || message.extendedTextMessage?.text || '',
        timestamp: new Date(timestamp * 1000),
        organizationId,
        messageType: 'incoming',
        sessionId,
      });

      await job.updateProgress(30);

      // 2. Si tiene media, agregar a cola de procesamiento de media
      if (this.hasMedia(message)) {
        await this.mediaQueue.add('process-media', {
          messageId: savedMessage.id,
          message,
          organizationId,
        }, {
          priority: 5,
        });
      }

      await job.updateProgress(60);

      // 3. Agregar a cola de ejecución de flows
      await this.flowQueue.add('check-triggers', {
        messageId: savedMessage.id,
        from,
        content: savedMessage.content,
        organizationId,
      }, {
        priority: 3,
      });

      await job.updateProgress(100);

      return {
        success: true,
        messageId: savedMessage.id,
        hasMedia: this.hasMedia(message),
      };
    } catch (error) {
      this.logger.error(`Error processing incoming message: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'send-outgoing',
    concurrency: 3, // Limitar para respetar rate limits de WhatsApp
  })
  async handleOutgoingMessage(job: Job<OutgoingMessageJob>) {
    this.logger.log(`Sending message to ${job.data.to}`);

    try {
      const { to, message, messageId, organizationId, sessionId, mediaUrl } = job.data;

      // Delay para rate limiting (100ms entre mensajes = 10 msg/seg)
      await this.delay(100);

      // Enviar mensaje vía WhatsApp
      let result;
      if (mediaUrl) {
        result = await this.whatsappService.sendMediaMessage(
          to,
          mediaUrl,
          message,
          organizationId,
        );
      } else {
        result = await this.whatsappService.sendTextMessage(
          to,
          message,
          organizationId,
        );
      }

      // Actualizar mensaje en BD con resultado
      if (messageId) {
        await this.messagesService.update(messageId, {
          status: 'sent',
          externalId: result.key?.id,
        });
      }

      return {
        success: true,
        messageId: result.key?.id,
        to,
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      
      // Si el mensaje es importante, podemos guardarlo para retry manual
      if (job.data.messageId) {
        await this.messagesService.update(job.data.messageId, {
          status: 'failed',
          error: error.message,
        });
      }
      
      throw error;
    }
  }

  @Process({
    name: 'send-template',
    concurrency: 2,
  })
  async handleTemplateMessage(job: Job) {
    this.logger.log(`Sending template message to ${job.data.to}`);

    try {
      const { to, templateName, templateParams, organizationId } = job.data;

      await this.delay(100); // Rate limiting

      const result = await this.whatsappService.sendTemplateMessage(
        to,
        templateName,
        templateParams,
        organizationId,
      );

      return {
        success: true,
        messageId: result.key?.id,
      };
    } catch (error) {
      this.logger.error(`Error sending template: ${error.message}`);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed with result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }

  private hasMedia(message: any): boolean {
    return !!(
      message.imageMessage ||
      message.videoMessage ||
      message.audioMessage ||
      message.documentMessage
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
