import { Module } from '@nestjs/common';
import { QuickRepliesService } from './quick-replies.service';
import { QuickRepliesController } from './quick-replies.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuickRepliesController],
  providers: [QuickRepliesService],
  exports: [QuickRepliesService],
})
export class QuickRepliesModule {}
