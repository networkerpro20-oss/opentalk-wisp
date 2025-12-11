import { Module } from '@nestjs/common';
import { InternalNotesService } from './internal-notes.service';
import { InternalNotesController } from './internal-notes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InternalNotesController],
  providers: [InternalNotesService],
  exports: [InternalNotesService],
})
export class InternalNotesModule {}
