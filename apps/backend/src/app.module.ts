import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

// Feature modules
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { DealsModule } from './deals/deals.module';
import { AiModule } from './ai/ai.module';
import { FlowsModule } from './flows/flows.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production', // En producción, usar solo variables de entorno
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Core modules
    PrismaModule,
    HealthModule,
    AuthModule,

    // Feature modules
    OrganizationsModule,
    UsersModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    WhatsappModule,
    DealsModule,
    AiModule,
    FlowsModule,
    QueuesModule,
  ],
})
export class AppModule {}
