import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { MessagesService } from '../../messages/messages.service';

interface IncomingMessageJob {
  from: string;
  message: any;
  timestamp: number;
  organizationId: string;
  conversationId: string;
}

interface OutgoingMessageJob {
  to: string;
  message: string;
  organizationId: string;
  messageId?: string;
  mediaUrl?: string;
}

interface TemplateMessageJob {
  to: string;
  templateName: string;
  templateParams: any[];
  organizationId: string;
}

@Processor('whatsapp-messages')
export class WhatsappQueueProcessor {
  private readonly logger = new Logger(WhatsappQueueProcessor.name);

  constructor(
    private whatsappService: WhatsappService,
    private messagesService: MessagesService,
    @InjectQueue('media-processing') private mediaQueue: Queue,
    @InjectQueue('flow-execution') private flowQueue: Queue,
  ) {}

  @Process({
    name: 'process-incoming',
    concurrency: 5,
  })
  async handleIncomingMessage(job: Job<IncomingMessageJob>) {
    this.logger.log(`Processing incoming message from ${job.data.from}`);

    try {
      const { from, message, conversationId, organizationId } = job.data;

      // Extraer contenido del mensaje
      const content = message.conversation || message.extendedTextMessage?.text || '';

      this.logger.log(`Message content: ${content.substring(0, 50)}...`);

      // Verificar si tiene media
      if (this.hasMedia(message)) {
        this.logger.log('Message has media - would add to media queue');
      }

      return {
        success: true,
        from,
        contentLength: content.length,
        hasMedia: this.hasMedia(message),
      };
    } catch (error) {
      this.logger.error(`Error processing incoming message: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'send-outgoing',
    concurrency: 3,
  })
  async handleOutgoingMessage(job: Job<OutgoingMessageJob>) {
    this.logger.log(`Sending outgoing message to ${job.data.to}`);

    try {
      const { to, message, organizationId } = job.data;

      // Rate limiting
      await this.delay(100);

      // Enviar mensaje via WhatsApp
      const result = await this.whatsappService.sendMessage(
        to,
        { text: message },
        organizationId,
      );

      this.logger.log(`Message sent successfully to ${to}`);

      return {
        success: true,
        to,
        messageId: result.key?.id,
      };
    } catch (error) {
      this.logger.error(`Error sending outgoing message: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'send-template',
    concurrency: 2,
  })
  async handleTemplateMessage(job: Job<TemplateMessageJob>) {
    this.logger.log(`Sending template message to ${job.data.to}`);

    try {
      const { to, templateName, organizationId } = job.data;

      // Rate limiting
      await this.delay(100);

      this.logger.log(`Template "${templateName}" would be sent to ${to}`);

      return {
        success: true,
        to,
        templateName,
        note: 'Template sending simplified for MVP',
      };
    } catch (error) {
      this.logger.error(`Error sending template message: ${error.message}`);
      throw error;
    }
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
