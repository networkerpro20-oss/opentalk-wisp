import { Module } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { FlowsController } from './flows.controller';
import { FlowEngineService } from './flow-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, AiModule, WhatsappModule],
  controllers: [FlowsController],
  providers: [FlowsService, FlowEngineService],
  exports: [FlowsService, FlowEngineService],
})
export class FlowsModule {}
