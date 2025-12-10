import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || process.env.PORT || 10000;
  const apiPrefix = configService.get('API_PREFIX', '/api');

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  const frontendUrl = configService.get('FRONTEND_URL') || process.env.FRONTEND_URL || 'http://localhost:3001';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('OpenTalkWisp API')
      .setDescription('CRM Omnicanal SaaS Multi-Empresa con IA para WhatsApp')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Organizations', 'Organization management')
      .addTag('Users', 'User management')
      .addTag('Contacts', 'Contact management')
      .addTag('Conversations', 'Conversation management')
      .addTag('Messages', 'Message management')
      .addTag('WhatsApp', 'WhatsApp integration')
      .addTag('Deals', 'Deal management')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      customSiteTitle: 'OpenTalkWisp API Docs',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }

  await app.listen(port, '0.0.0.0');

  console.log(`
🚀 OpenTalkWisp Backend is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
📍 Port: ${port}
📍 API: ${apiPrefix}
📍 Frontend URL: ${frontendUrl}
🏥 Health: ${apiPrefix}/health
📖 Docs: ${apiPrefix}/docs
  `);
}

bootstrap();
