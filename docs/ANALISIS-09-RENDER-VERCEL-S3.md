# ☁️ INFRAESTRUCTURA CON RENDER + VERCEL + AWS S3

**Proyecto:** OpenTalkWisp  
**Fecha:** 10 de diciembre de 2025  
**Documento:** 09 - Estrategia de Deployment Serverless

---

## 🎯 RESUMEN EJECUTIVO

### Stack de Deployment

```yaml
Backend + Database: Render
  - Web Service (NestJS)
  - PostgreSQL 15
  - Redis 7
  - Auto-scaling
  - Backups automáticos

Frontend: Vercel
  - Next.js 14
  - Edge Functions
  - Global CDN
  - Analytics
  - Preview deployments

Storage: AWS S3
  - Archivos media
  - Backups
  - Exports
  - CloudFront CDN (opcional)
```

### 💰 Ventajas Clave

✅ **Costos iniciales ultra bajos**: $85-141/mes (vs $460+ VPS tradicional)  
✅ **Zero DevOps al inicio**: Deploy con git push  
✅ **Auto-scaling nativo**: Maneja picos sin configuración  
✅ **SSL/HTTPS incluido**: Sin costos adicionales  
✅ **Backups automáticos**: PostgreSQL con PITR  
✅ **Global CDN**: Latencia baja worldwide  
✅ **Preview environments**: Una URL por cada PR  

---

## 🟣 RENDER: BACKEND + DATABASE

### 🔧 Configuración del Proyecto

#### 1. Crear Cuenta en Render

```bash
# 1. Visitar https://render.com y crear cuenta
# 2. Conectar repositorio GitHub
# 3. Crear Blueprint para infraestructura completa
```

#### 2. Blueprint YAML (render.yaml)

Crear archivo en la raíz del proyecto:

```yaml
# render.yaml
services:
  # Backend NestJS
  - type: web
    name: opentalkwisp-backend
    runtime: node
    region: oregon # o frankfurt para Europa
    plan: starter # $7/mes → standard $25 → pro $85
    buildCommand: cd apps/backend && pnpm install && pnpm build
    startCommand: cd apps/backend && pnpm start:prod
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DATABASE_URL
        fromDatabase:
          name: opentalkwisp-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: opentalkwisp-redis
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: OPENAI_API_KEY
        sync: false # Configurar manualmente
      - key: WHATSAPP_WEBHOOK_VERIFY_TOKEN
        generateValue: true
      - key: AWS_S3_BUCKET
        sync: false
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
    autoDeploy: true
    
  # Redis Cache
  - type: redis
    name: opentalkwisp-redis
    region: oregon
    plan: starter # Incluido en web service plan
    maxmemoryPolicy: allkeys-lru
    ipAllowList: [] # Solo acceso interno

databases:
  # PostgreSQL
  - name: opentalkwisp-db
    databaseName: opentalkwisp
    region: oregon
    plan: starter # $7/mes → standard $20 → pro $90
    user: opentalkwisp_user
    postgresMajorVersion: 15
    ipAllowList: [] # Solo acceso interno
```

#### 3. Configuración Avanzada

**Archivo: apps/backend/package.json**

```json
{
  "name": "@opentalkwisp/backend",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:prod": "node dist/main",
    "migrate": "prisma migrate deploy",
    "postinstall": "prisma generate"
  },
  "engines": {
    "node": ">=20.11.0",
    "pnpm": ">=8.15.0"
  }
}
```

**Build Command en Render:**
```bash
pnpm install && pnpm prisma:generate && pnpm build
```

**Start Command en Render:**
```bash
pnpm prisma:migrate:deploy && pnpm start:prod
```

#### 4. Health Check Endpoint

```typescript
// apps/backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
```

### 📊 Planes y Pricing de Render

#### Web Services (Backend)

| Plan | RAM | CPU | vCPU | Disco | Bandwidth | Precio |
|------|-----|-----|------|-------|-----------|--------|
| **Starter** | 512 MB | 0.5 | Shared | 10 GB | 100 GB | $7/mes |
| **Standard** | 2 GB | 1.0 | Shared | 10 GB | 500 GB | $25/mes |
| **Pro** | 4 GB | 2.0 | Dedicated | 10 GB | 1 TB | $85/mes |
| **Pro Plus** | 8 GB | 4.0 | Dedicated | 10 GB | 2 TB | $185/mes |
| **Pro Max** | 16 GB | 8.0 | Dedicated | 10 GB | 5 TB | $390/mes |

#### PostgreSQL Database

| Plan | RAM | Storage | Backups | Connection Pool | HA | Precio |
|------|-----|---------|---------|----------------|-------|--------|
| **Starter** | 1 GB | 1 GB | 7 días | 25 | No | $7/mes |
| **Standard** | 4 GB | 50 GB | 7 días | 97 | No | $20/mes |
| **Pro** | 8 GB | 256 GB | 14 días | 400 | Sí | $90/mes |
| **Pro 512** | 32 GB | 512 GB | 14 días | 1597 | Sí | $280/mes |

#### Redis Cache

| Plan | RAM | Persistence | Maxmemory Policy | Precio |
|------|-----|-------------|------------------|--------|
| **Starter** | 25 MB | No | allkeys-lru | Incluido |
| **Standard** | 256 MB | Opcional | Configurable | $10/mes |
| **Pro** | 1 GB | Sí | Configurable | $30/mes |
| **Pro Plus** | 4 GB | Sí | Configurable | $90/mes |

### 🔐 Variables de Entorno

Configurar en Dashboard de Render:

```bash
# Aplicación
NODE_ENV=production
PORT=3000
API_PREFIX=/api
CORS_ORIGIN=https://opentalkwisp.com,https://www.opentalkwisp.com

# Database (auto-generado por Render)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (auto-generado por Render)
REDIS_URL=redis://red-xxx:6379

# JWT
JWT_SECRET=<auto-generated>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000

# WhatsApp (Baileys)
WHATSAPP_SESSION_PATH=/tmp/baileys_sessions
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<auto-generated>

# AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=opentalkwisp-prod-media
AWS_ACCESS_KEY_ID=AKIAXXXXX
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_CDN_URL=https://d1234567.cloudfront.net

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@opentalkwisp.com
SENDGRID_FROM_NAME=OpenTalkWisp

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxxxx
```

### 🚀 Deployment

#### Primer Deploy

```bash
# 1. Push código a GitHub
git add .
git commit -m "feat: initial setup"
git push origin main

# 2. En Render Dashboard:
#    - New → Blueprint
#    - Conectar repo
#    - Seleccionar render.yaml
#    - Deploy

# 3. Esperar build (~5-10 minutos primera vez)

# 4. Ver logs en tiempo real
# https://dashboard.render.com/web/srv-xxxxx/logs
```

#### Deploys Subsecuentes

```bash
# Auto-deploy en cada push a main
git push origin main

# Preview deploy para branches
git checkout -b feature/new-feature
git push origin feature/new-feature
# Render crea preview environment automáticamente
```

### 📦 Migraciones de Base de Datos

#### Estrategia con Prisma

```bash
# 1. Crear migración en local
pnpm prisma migrate dev --name add_campaigns_table

# 2. Commit migration files
git add prisma/migrations
git commit -m "db: add campaigns table"

# 3. Push a main
git push origin main

# 4. Render ejecuta automáticamente en build:
#    pnpm prisma migrate deploy
```

#### Migraciones Manuales (en Render Shell)

```bash
# 1. En Render Dashboard → tu web service → Shell
# 2. Ejecutar:
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma db seed # si necesitas seed data
```

### 🔄 Auto-Scaling

Render escala automáticamente basado en:

```yaml
# Configurar en Dashboard
autoscaling:
  minInstances: 1
  maxInstances: 10
  targetCPUPercent: 70
  targetMemoryPercent: 80
```

**Ventajas:**
- ✅ Sin configuración manual
- ✅ Scale-to-zero en planes altos (ahorro costos)
- ✅ Horizontal scaling automático
- ✅ Health checks automáticos

### 📊 Monitoring en Render

#### Built-in Metrics

Render provee:
- ✅ CPU usage
- ✅ Memory usage
- ✅ Request rate (req/s)
- ✅ Response time (p50, p95, p99)
- ✅ Error rate (4xx, 5xx)
- ✅ Database connections
- ✅ Disk usage

#### Integración con DataDog

```typescript
// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import * as ddTrace from 'dd-trace';

// Inicializar DataDog APM
ddTrace.init({
  service: 'opentalkwisp-backend',
  env: process.env.NODE_ENV,
  version: process.env.npm_package_version,
  logInjection: true,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

### 🔐 Backups en Render

#### PostgreSQL Backups

**Automático:**
- ✅ Backups diarios incluidos
- ✅ Retención: 7 días (Starter), 14 días (Pro)
- ✅ Point-in-time recovery (Pro)

**Manual:**
```bash
# Backup bajo demanda en Dashboard
# O vía API:
curl -X POST https://api.render.com/v1/services/srv-xxx/backups \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

**Descargar backup:**
```bash
# 1. Ir a Dashboard → Database → Backups
# 2. Click "Download" en backup deseado
# 3. O vía psql:
pg_dump $DATABASE_URL > backup.sql
```

---

## ▲ VERCEL: FRONTEND

### 🔧 Configuración del Proyecto

#### 1. Crear Cuenta en Vercel

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy desde directorio del proyecto
cd apps/frontend
vercel
```

#### 2. Configuración vercel.json

```json
{
  "version": 2,
  "buildCommand": "cd apps/frontend && pnpm build",
  "outputDirectory": "apps/frontend/.next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "fra1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.opentalkwisp.com",
    "NEXT_PUBLIC_WS_URL": "wss://api.opentalkwisp.com",
    "NEXT_PUBLIC_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.opentalkwisp.com/api/:path*"
    }
  ]
}
```

#### 3. Configuración Next.js

```javascript
// apps/frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimizaciones de imagen
  images: {
    domains: [
      'opentalkwisp-prod-media.s3.amazonaws.com',
      'd1234567.cloudfront.net', // CloudFront CDN
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Output standalone para optimizar bundle
  output: 'standalone',
  
  // Experimental features
  experimental: {
    serverActions: true,
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 📊 Planes y Pricing de Vercel

| Plan | Bandwidth | Build Time | Domains | Team | Analytics | Precio |
|------|-----------|------------|---------|------|-----------|--------|
| **Hobby** | 100 GB | 6,000 min | Ilimitados | 1 | Básico | $0/mes |
| **Pro** | 1 TB | 24,000 min | Ilimitados | Ilimitado | Avanzado | $20/mes |
| **Enterprise** | Custom | Custom | Ilimitados | Ilimitado | Premium | $150+/mes |

#### Features por Plan

**Hobby (Gratis):**
- ✅ Deploy automático desde Git
- ✅ Preview deployments
- ✅ SSL/HTTPS automático
- ✅ Edge Network global
- ✅ 100 GB bandwidth/mes
- ✅ Analytics básico
- ⚠️ No custom domains comerciales

**Pro ($20/mes - Recomendado):**
- ✅ Todo de Hobby +
- ✅ 1 TB bandwidth
- ✅ Image Optimization ilimitada
- ✅ Analytics avanzado
- ✅ Password protection
- ✅ Team collaboration
- ✅ Priority support

**Enterprise ($150+/mes):**
- ✅ Todo de Pro +
- ✅ Custom bandwidth
- ✅ SLA 99.99%
- ✅ Dedicated support
- ✅ Advanced security
- ✅ SAML SSO
- ✅ Audit logs

### 🌍 Dominios Personalizados

#### Configurar Dominio Principal

```bash
# 1. En Vercel Dashboard → tu proyecto → Settings → Domains

# 2. Agregar dominios:
opentalkwisp.com
www.opentalkwisp.com

# 3. Configurar DNS:
# A record para apex domain:
A @ 76.76.21.21

# CNAME para www:
CNAME www cname.vercel-dns.com
```

#### Multi-Tenant Subdomains

```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // Excluir dominios principales
  if (['www', 'opentalkwisp', 'localhost'].includes(subdomain)) {
    return NextResponse.next();
  }
  
  // Reescribir a página de tenant
  const url = request.nextUrl.clone();
  url.pathname = `/tenant/${subdomain}${url.pathname}`;
  
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next|_static|favicon.ico).*)'],
};
```

**Configurar wildcard domain:**
```bash
# DNS:
A * 76.76.21.21

# O CNAME:
CNAME * cname.vercel-dns.com
```

### 🚀 Edge Functions

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Hello from Edge!',
    region: process.env.VERCEL_REGION,
  });
}
```

**Ventajas de Edge:**
- ✅ Latencia ultra-baja (<50ms)
- ✅ 300+ ubicaciones globales
- ✅ Sin cold starts
- ✅ Límites generosos (1M requests/día en Pro)

### 📊 Analytics de Vercel

#### Web Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Métricas disponibles:**
- ✅ Page views
- ✅ Unique visitors
- ✅ Top pages
- ✅ Referrers
- ✅ Devices (desktop/mobile/tablet)
- ✅ Countries
- ✅ Browsers

#### Speed Insights

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Métricas Core Web Vitals:**
- ✅ LCP (Largest Contentful Paint)
- ✅ FID (First Input Delay)
- ✅ CLS (Cumulative Layout Shift)
- ✅ TTFB (Time to First Byte)

### 🔐 Environment Variables

```bash
# En Vercel Dashboard → Settings → Environment Variables

# Production
NEXT_PUBLIC_API_URL=https://api.opentalkwisp.com
NEXT_PUBLIC_WS_URL=wss://api.opentalkwisp.com
NEXT_PUBLIC_S3_CDN=https://d1234567.cloudfront.net

# Preview (branches)
NEXT_PUBLIC_API_URL=https://staging-api.opentalkwisp.com
NEXT_PUBLIC_WS_URL=wss://staging-api.opentalkwisp.com

# Development (local)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### 🔄 Preview Deployments

**Automático por cada PR:**

```bash
# 1. Crear feature branch
git checkout -b feature/new-dashboard

# 2. Push cambios
git push origin feature/new-dashboard

# 3. Vercel crea preview automáticamente
# URL: https://opentalkwisp-git-feature-new-dashboard-yourteam.vercel.app

# 4. Comentario en PR con URL de preview
```

**Ventajas:**
- ✅ Test en producción sin afectar main
- ✅ Compartir con stakeholders
- ✅ QA visual antes de merge
- ✅ URLs únicas por commit

---

## 🪣 AWS S3 + CLOUDFRONT: STORAGE

### 🔧 Configuración de S3

#### 1. Crear Buckets

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciales
aws configure
# AWS Access Key ID: AKIAXXXXX
# AWS Secret Access Key: xxxxx
# Default region: us-east-1
# Default output format: json

# Crear buckets
aws s3api create-bucket \
  --bucket opentalkwisp-prod-media \
  --region us-east-1

aws s3api create-bucket \
  --bucket opentalkwisp-prod-backups \
  --region us-east-1

aws s3api create-bucket \
  --bucket opentalkwisp-prod-exports \
  --region us-east-1
```

#### 2. Configurar Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::opentalkwisp-prod-media/public/*"
    },
    {
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::opentalkwisp-prod-media/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

#### 3. Configurar CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": [
      "https://opentalkwisp.com",
      "https://www.opentalkwisp.com",
      "https://*.opentalkwisp.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### 4. Lifecycle Policies

```json
{
  "Rules": [
    {
      "Id": "Archive old backups",
      "Status": "Enabled",
      "Prefix": "backups/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    },
    {
      "Id": "Auto-delete temp files",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

### ☁️ CloudFront CDN (Opcional pero Recomendado)

#### 1. Crear Distribución

```bash
# Via AWS Console:
# 1. CloudFront → Create Distribution
# 2. Origin Domain: opentalkwisp-prod-media.s3.us-east-1.amazonaws.com
# 3. Origin Access: Origin Access Control (OAC)
# 4. Viewer Protocol Policy: Redirect HTTP to HTTPS
# 5. Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
# 6. Cache Policy: CachingOptimized
# 7. Compress Objects: Yes

# O vía CLI:
aws cloudfront create-distribution \
  --origin-domain-name opentalkwisp-prod-media.s3.us-east-1.amazonaws.com \
  --default-root-object index.html
```

#### 2. Configurar CNAME

```bash
# DNS:
CNAME media.opentalkwisp.com d1234567.cloudfront.net
CNAME cdn.opentalkwisp.com d1234567.cloudfront.net
```

#### 3. SSL Certificate

```bash
# Solicitar certificado en ACM (us-east-1 para CloudFront)
aws acm request-certificate \
  --domain-name media.opentalkwisp.com \
  --validation-method DNS \
  --region us-east-1

# Validar vía DNS
# Agregar CNAME records que ACM proporciona

# Asociar a CloudFront
aws cloudfront update-distribution \
  --id E1234567890ABC \
  --viewer-certificate \
    ACMCertificateArn=arn:aws:acm:us-east-1:xxx:certificate/xxx,\
    SSLSupportMethod=sni-only,\
    MinimumProtocolVersion=TLSv1.2_2021
```

### 📦 Integración en Backend (NestJS)

#### 1. Instalar SDK

```bash
cd apps/backend
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### 2. Servicio S3

```typescript
// apps/backend/src/storage/s3.service.ts
import { Injectable } from '@nestjs/common';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket = process.env.AWS_S3_BUCKET;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private', // o 'public-read' para archivos públicos
      }),
    );

    // Retornar URL de CloudFront
    return `${process.env.AWS_S3_CDN_URL}/${key}`;
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // URL firmada válida por 1 hora
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
```

#### 3. Upload Endpoint

```typescript
// apps/backend/src/media/media.controller.ts
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { S3Service } from '../storage/s3.service';

@Controller('api/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Archivo muy grande (max 10MB)');
    }

    // Subir a S3
    const url = await this.s3Service.uploadFile(file, 'media');

    return {
      url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
```

### 💰 Pricing de S3 + CloudFront

#### AWS S3

| Métrica | Precio |
|---------|--------|
| **Storage (Standard)** | $0.023/GB/mes |
| **Storage (Intelligent-Tiering)** | $0.023/GB/mes (automático) |
| **PUT/COPY/POST** | $0.005 por 1,000 requests |
| **GET/SELECT** | $0.0004 por 1,000 requests |
| **Data Transfer Out** | $0.09/GB (primeros 10TB) |

**Ejemplo 100GB de archivos:**
```
Storage: 100 GB × $0.023 = $2.30/mes
Uploads: 10,000 × $0.005/1000 = $0.05/mes
Downloads: 50,000 × $0.0004/1000 = $0.02/mes
Transfer: 200 GB × $0.09 = $18.00/mes

TOTAL: ~$20.37/mes
```

#### CloudFront CDN

| Métrica | Precio |
|---------|--------|
| **Data Transfer Out (US/EU)** | $0.085/GB (primeros 10TB) |
| **Data Transfer Out (Asia)** | $0.12/GB |
| **HTTP Requests** | $0.0075 por 10,000 requests |
| **HTTPS Requests** | $0.01 por 10,000 requests |
| **Invalidations** | Gratis (primeras 1,000/mes) |

**Ejemplo 200GB CDN + 1M requests:**
```
Data Transfer: 200 GB × $0.085 = $17.00/mes
HTTPS Requests: 1,000,000 × $0.01/10000 = $10.00/mes

TOTAL: ~$27.00/mes
```

**💡 Ahorro vs S3 directo:** CloudFront es más barato que data transfer directo desde S3.

---

## 🔄 CI/CD CON GITHUB ACTIONS

### Workflow Completo

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render + Vercel

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.11.0'
  PNPM_VERSION: '8.15.0'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm type-check
      
      - name: Test Backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
        run: |
          cd apps/backend
          pnpm test:cov
      
      - name: Test Frontend
        run: |
          cd apps/frontend
          pnpm test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  deploy-backend:
    name: Deploy Backend to Render
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_BACKEND }}
      
      - name: Wait for deployment
        run: sleep 60
      
      - name: Health check
        run: |
          curl -f https://api.opentalkwisp.com/api/health || exit 1

  deploy-frontend:
    name: Deploy Frontend to Vercel
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install Vercel CLI
        run: pnpm add -g vercel
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: apps/frontend
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: apps/frontend
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: apps/frontend

  backup-db:
    name: Backup Database to S3
    needs: [deploy-backend, deploy-frontend]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
      - name: Backup to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          # Trigger backup endpoint
          curl -X POST https://api.opentalkwisp.com/api/admin/backup \
            -H "Authorization: Bearer ${{ secrets.ADMIN_API_KEY }}"
```

### GitHub Secrets Necesarios

```bash
# Render
RENDER_DEPLOY_HOOK_BACKEND=https://api.render.com/deploy/srv-xxxxx
RENDER_API_KEY=rnd_xxxxx

# Vercel
VERCEL_TOKEN=xxxxx
VERCEL_ORG_ID=team_xxxxx
VERCEL_PROJECT_ID=prj_xxxxx

# AWS
AWS_ACCESS_KEY_ID=AKIAXXXXX
AWS_SECRET_ACCESS_KEY=xxxxx

# Admin
ADMIN_API_KEY=xxxxx
```

---

## 📊 COMPARACIÓN DE COSTOS

### VPS Tradicional vs Render + Vercel

| Escala | VPS (DigitalOcean) | Render + Vercel + S3 | Ahorro |
|--------|-------------------|---------------------|--------|
| **Startup (0-100)** | $145/mes | $85-141/mes | ~$20/mes |
| **Growth (100-500)** | $520/mes | $285-445/mes | ~$150/mes |
| **Scale (500-2k)** | $2,070/mes | $845-1,245/mes | ~$900/mes |
| **Enterprise (2k+)** | $5,500/mes | $1,865-3,945/mes | ~$1,800/mes |

### Ventajas del Stack Serverless

✅ **Setup time:** 1 hora vs 2-3 días  
✅ **DevOps:** Incluido vs contratar especialista  
✅ **Scaling:** Automático vs manual  
✅ **Monitoring:** Incluido vs configurar  
✅ **Backups:** Automático vs scripts  
✅ **SSL:** Incluido vs Let's Encrypt manual  
✅ **CDN:** Incluido vs Cloudflare Pro  
✅ **Zero-downtime deploys:** Sí vs configurar  

---

## 🎯 RECOMENDACIONES FINALES

### Stack Inicial (MVP - Meses 1-3)

```yaml
Backend: Render Starter ($7/mes)
Database: Render PostgreSQL Starter ($7/mes)
Redis: Incluido
Frontend: Vercel Pro ($20/mes)
Storage: AWS S3 (~$5-10/mes)

TOTAL: ~$40-45/mes
```

### Growth (Meses 4-6)

```yaml
Backend: Render Standard ($25/mes)
Database: Render PostgreSQL Standard ($20/mes)
Redis: Render Redis Standard ($10/mes)
Frontend: Vercel Pro ($20-50/mes)
Storage: AWS S3 + CloudFront (~$30-50/mes)

TOTAL: ~$105-155/mes
```

### Scale (Meses 7-12)

```yaml
Backend: Render Pro ($85/mes) x2 = $170/mes
Database: Render PostgreSQL Pro ($90/mes)
Redis: Render Redis Pro ($30/mes)
Frontend: Vercel Enterprise ($150/mes)
Storage: AWS S3 + CloudFront (~$80-100/mes)

TOTAL: ~$520-540/mes
```

### Cuándo Migrar a VPS/Kubernetes

Considerar migración cuando:
- ✅ >5,000 empresas activas
- ✅ >$100k MRR
- ✅ Costos serverless >$5k/mes
- ✅ Team con DevOps dedicado
- ✅ Necesidades muy específicas de infra

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Semana 1: Setup Inicial

```bash
☐ Crear cuenta Render
☐ Crear cuenta Vercel
☐ Crear cuenta AWS
☐ Configurar GitHub repository
☐ Crear render.yaml
☐ Crear vercel.json
☐ Configurar buckets S3
☐ Configurar CloudFront (opcional)
☐ Setup dominios DNS
☐ Configurar GitHub Actions
☐ Agregar secrets a GitHub
```

### Semana 2: Primer Deploy

```bash
☐ Deploy backend a Render
☐ Deploy frontend a Vercel
☐ Verificar health checks
☐ Test subida de archivos a S3
☐ Configurar monitoring
☐ Setup backup automático
☐ Test multi-tenancy
☐ Configurar alertas
```

### Ongoing: Optimización

```bash
☐ Monitorear costos semanalmente
☐ Optimizar queries lentas
☐ Configurar caching agresivo
☐ Implementar rate limiting
☐ Setup APM (DataDog/Sentry)
☐ Revisar CloudFront cache hit rate
☐ Optimizar bundle size frontend
☐ Setup logs centralizados
```

---

## 🎉 CONCLUSIÓN

**Render + Vercel + AWS S3 es la combinación perfecta para OpenTalkWisp:**

✅ Costos iniciales ultra-bajos (~$40/mes)  
✅ Deploy simplificado (git push)  
✅ Auto-scaling sin configuración  
✅ Backups automáticos incluidos  
✅ Global CDN incluido  
✅ SSL/HTTPS automático  
✅ Preview environments por PR  
✅ Monitoring básico incluido  

**Puedes iniciar el MVP con <$50/mes y escalar a miles de clientes sin cambiar la arquitectura.**

🚀 **¡Listo para comenzar el desarrollo!**

