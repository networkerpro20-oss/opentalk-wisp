import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MessagesService } from '../../messages/messages.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MediaProcessingJob {
  messageId: number;
  message: any;
  organizationId: number;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

@Processor('media-processing')
export class MediaQueueProcessor {
  private readonly logger = new Logger(MediaQueueProcessor.name);

  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @Process({
    name: 'process-media',
    concurrency: 2, // Procesar 2 archivos multimedia simultáneamente
  })
  async handleMediaProcessing(job: Job<MediaProcessingJob>) {
    this.logger.log(`Processing media for message ${job.data.messageId}`);

    try {
      const { messageId, message, organizationId } = job.data;

      // Detectar tipo de media
      const mediaType = this.detectMediaType(message);
      await job.updateProgress(10);

      // Extraer información de la media
      const mediaInfo = this.extractMediaInfo(message, mediaType);
      await job.updateProgress(30);

      // Descargar media (simulado - integrar con Baileys)
      this.logger.log(`Downloading ${mediaType} from WhatsApp...`);
      // const buffer = await this.downloadMedia(message, mediaType);
      await job.updateProgress(60);

      // Guardar temporalmente
      // const filePath = await this.saveMediaTemporarily(buffer, mediaType, messageId);
      await job.updateProgress(80);

      // Actualizar mensaje con información de media
      await this.messagesService.update(messageId, {
        mediaType,
        mediaUrl: mediaInfo.url,
        mediaMimeType: mediaInfo.mimeType,
        mediaSize: mediaInfo.fileLength,
      });

      await job.updateProgress(100);

      return {
        success: true,
        messageId,
        mediaType,
        mediaInfo,
      };
    } catch (error) {
      this.logger.error(`Error processing media: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'compress-video',
    concurrency: 1, // Solo 1 video a la vez (CPU intensive)
  })
  async handleVideoCompression(job: Job) {
    this.logger.log(`Compressing video for message ${job.data.messageId}`);

    try {
      // Aquí iría la lógica de compresión con ffmpeg
      // Por ahora simulamos el proceso
      await this.delay(5000); // Simular compresión
      
      return {
        success: true,
        compressed: true,
        originalSize: job.data.originalSize,
        compressedSize: job.data.originalSize * 0.5,
      };
    } catch (error) {
      this.logger.error(`Error compressing video: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'generate-thumbnail',
    concurrency: 3,
  })
  async handleThumbnailGeneration(job: Job) {
    this.logger.log(`Generating thumbnail for media ${job.data.messageId}`);

    try {
      // Lógica de generación de thumbnail
      await this.delay(1000);
      
      return {
        success: true,
        thumbnailUrl: `https://storage.example.com/thumbnails/${job.data.messageId}.jpg`,
      };
    } catch (error) {
      this.logger.error(`Error generating thumbnail: ${error.message}`);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing media job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Media job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Media job ${job.id} failed: ${error.message}`);
  }

  private detectMediaType(message: any): 'image' | 'video' | 'audio' | 'document' {
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    throw new Error('Unknown media type');
  }

  private extractMediaInfo(message: any, mediaType: string) {
    let mediaMessage;
    switch (mediaType) {
      case 'image':
        mediaMessage = message.imageMessage;
        break;
      case 'video':
        mediaMessage = message.videoMessage;
        break;
      case 'audio':
        mediaMessage = message.audioMessage;
        break;
      case 'document':
        mediaMessage = message.documentMessage;
        break;
    }

    return {
      url: mediaMessage?.url || '',
      mimeType: mediaMessage?.mimetype || '',
      fileLength: mediaMessage?.fileLength || 0,
      fileName: mediaMessage?.fileName || '',
      caption: mediaMessage?.caption || '',
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
