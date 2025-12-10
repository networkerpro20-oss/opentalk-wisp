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

  // CORS - Configuración robusta que lee múltiples variables
  const frontendUrl = 
    configService.get('FRONTEND_URL') || 
    process.env.FRONTEND_URL || 
    configService.get('CORS_ORIGIN') ||
    process.env.CORS_ORIGIN ||
    'http://localhost:3001';
    
  const allowedOrigins = [
    'http://localhost:3001', 
    'http://localhost:3000',
    'https://opentalk-wisp-frontend.vercel.app',
    'https://opentalk-wisp-frontend-mirhxs4hd.vercel.app'
  ];
  
  // Agregar la URL configurada si no está en la lista
  if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }
  
  console.log('🔧 CORS permitidos:', allowedOrigins);
  console.log('🌐 FRONTEND_URL configurada:', frontendUrl);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como curl, Postman, etc)
      if (!origin) return callback(null, true);
      
      // Verificar si el origin está en la lista permitida
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('⚠️ Origin bloqueado:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 horas
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
