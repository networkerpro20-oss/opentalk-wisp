import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WhatsappQueueProcessor } from './processors/whatsapp-queue.processor';
import { MediaQueueProcessor } from './processors/media-queue.processor';
import { FlowQueueProcessor } from './processors/flow-queue.processor';
import { AiQueueProcessor } from './processors/ai-queue.processor';
import { QueuesController } from './queues.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { MessagesModule } from '../messages/messages.module';
import { FlowsModule } from '../flows/flows.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        
        // Si hay REDIS_URL (producción en Render), usarla
        if (redisUrl) {
          return {
            redis: redisUrl,
            defaultJobOptions: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              removeOnComplete: {
                age: 3600, // Mantener 1 hora
                count: 1000,
              },
              removeOnFail: {
                age: 86400, // Mantener 24 horas
              },
            },
          };
        }
        
        // Configuración local con host/port/password
        return {
          redis: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: {
              age: 3600, // Mantener 1 hora
              count: 1000,
            },
            removeOnFail: {
              age: 86400, // Mantener 24 horas
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'whatsapp-messages' },
      { name: 'media-processing' },
      { name: 'flow-execution' },
      { name: 'ai-processing' },
    ),
    WhatsappModule,
    MessagesModule,
    FlowsModule,
    AiModule,
  ],
  providers: [
    WhatsappQueueProcessor,
    MediaQueueProcessor,
    FlowQueueProcessor,
    AiQueueProcessor,
  ],
  controllers: [QueuesController],
  exports: [BullModule],
})
export class QueuesModule {}
