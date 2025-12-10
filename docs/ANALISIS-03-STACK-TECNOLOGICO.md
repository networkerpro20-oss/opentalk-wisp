# 🛠️ ANÁLISIS STACK TECNOLÓGICO - OpenTalkWisp

**Proyecto:** CRM Omnicanal SaaS Multi-Empresa  
**Fecha:** 10 de diciembre de 2025  
**Documento:** 03 - Stack Tecnológico Detallado

---

## 🎯 OBJETIVO

Definir el stack tecnológico completo con:
- Versiones específicas de cada tecnología
- Justificación de cada elección
- Alternativas consideradas
- Compatibilidad y dependencias
- Configuración inicial

---

## 📦 STACK COMPLETO

### Vista General

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                       │
│  Next.js 14 + React 18 + TypeScript + Tailwind         │
└─────────────────────────┬───────────────────────────────┘
                          │ REST + WebSocket
┌─────────────────────────▼───────────────────────────────┐
│                    BACKEND LAYER                        │
│  NestJS 10 + TypeScript + Prisma + Redis               │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│ PostgreSQL   │  │    Redis     │  │  OpenAI     │
│   15.x       │  │    7.x       │  │  GPT-4      │
└──────────────┘  └──────────────┘  └─────────────┘
```

---

## 🔧 BACKEND STACK

### 1. Runtime: Node.js

**Versión:** `20.11.0 LTS`

**¿Por qué Node.js 20?**
```
✅ Long Term Support hasta abril 2026
✅ Performance mejorado (V8 engine 11.3)
✅ Native fetch API
✅ Test runner integrado
✅ Watch mode nativo
✅ Compatible con ES modules y CommonJS
```

**Instalación:**
```bash
# Via NVM (recomendado)
nvm install 20.11.0
nvm use 20.11.0
nvm alias default 20.11.0

# Verificar
node --version  # v20.11.0
npm --version   # 10.2.4
```

**Alternativas descartadas:**
- ❌ Node 18: Funciona, pero 20 tiene mejor performance
- ❌ Node 21: Impar, no LTS, menos estable
- ❌ Deno/Bun: Ecosistema inmaduro aún

---

### 2. Framework Backend: NestJS

**Versión:** `10.3.0`

**¿Por qué NestJS?**
```
✅ Arquitectura modular (inspirado en Angular)
✅ Dependency Injection nativa
✅ TypeScript first
✅ Decoradores para todo (routing, validation, etc)
✅ Integración con Prisma, TypeORM, etc
✅ WebSockets integrados (Socket.io)
✅ Testing facilitado (Jest integrado)
✅ Microservicios ready
✅ Documentación excelente
```

**Instalación:**
```bash
npm i -g @nestjs/cli@10.3.0
nest new backend --strict --package-manager pnpm
```

**Estructura de Módulos:**
```typescript
// apps/backend/src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    CampaignsModule,
    PipelineModule,
    FlowsModule,
    AiModule,
    WhatsAppModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
```

**Alternativas descartadas:**
- ❌ Express: Muy básico, sin estructura
- ❌ Fastify: Más rápido pero menos features
- ❌ Koa: Minimalista, requiere mucho setup
- ⚠️ Adonis.js: Bueno pero comunidad pequeña

---

### 3. Lenguaje: TypeScript

**Versión:** `5.3.3`

**¿Por qué TypeScript?**
```
✅ Type safety reduce bugs en 15-20%
✅ IntelliSense y autocomplete
✅ Refactoring seguro
✅ Documentación implícita
✅ Integración perfecta con NestJS y Next.js
✅ Interfaces compartidas entre frontend/backend
```

**tsconfig.json (Backend):**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"]
    },
    "incremental": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

### 4. ORM: Prisma

**Versión:** `5.8.0`

**¿Por qué Prisma?**
```
✅ Schema declarativo en un solo archivo
✅ Types automáticos (100% type-safe)
✅ Migraciones automáticas
✅ Prisma Studio (GUI visual)
✅ Query builder intuitivo
✅ Performance excellent (mejor que TypeORM)
✅ Multi-database support (PostgreSQL, MySQL, MongoDB)
✅ Relaciones y joins simplificados
```

**Instalación:**
```bash
pnpm add -D prisma@5.8.0
pnpm add @prisma/client@5.8.0

npx prisma init
```

**Ejemplo de Schema:**
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [uuid_ossp, pg_trgm]
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  subdomain String   @unique
  
  users     User[]
  contacts  Contact[]
  
  @@index([subdomain])
  @@map("organizations")
}
```

**Scripts package.json:**
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

**Alternativas descartadas:**
- ❌ TypeORM: Decoradores pesados, performance menor
- ❌ Sequelize: API verbosa, no type-safe
- ❌ Knex: Query builder puro, sin ORM features
- ⚠️ Drizzle: Prometedor pero aún inmaduro

---

### 5. Base de Datos: PostgreSQL

**Versión:** `15.5`

**¿Por qué PostgreSQL?**
```
✅ Open source y gratis
✅ ACID compliant (transacciones seguras)
✅ JSON/JSONB nativo (para custom fields)
✅ Full-text search nativo
✅ Índices avanzados (GIN, GiST, BRIN)
✅ Extensiones (pg_trgm, uuid-ossp, etc)
✅ Particionamiento de tablas
✅ Replicación master-slave
✅ Excelente para multi-tenancy
✅ Comunidad enorme
```

**Docker Compose (Desarrollo):**
```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15.5-alpine
    container_name: opentalkwisp-db
    restart: always
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: opentalkwisp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    command:
      - "postgres"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "effective_cache_size=1GB"

volumes:
  postgres_data:
    driver: local
```

**Extensiones necesarias:**
```sql
-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUIDs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Full-text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query monitoring
```

**Alternativas descartadas:**
- ❌ MySQL: Menos features avanzados
- ❌ MongoDB: No relacional, complicado para CRM
- ❌ CockroachDB: Overkill, más caro
- ⚠️ Supabase: Lock-in vendor, menos control

---

### 6. Cache y Queues: Redis

**Versión:** `7.2`

**¿Por qué Redis?**
```
✅ In-memory extremadamente rápido (<1ms)
✅ Pub/Sub para WebSockets distribuidos
✅ Queues con Bull para jobs asíncronos
✅ Session storage
✅ Rate limiting
✅ Cache de queries frecuentes
✅ Socket.io adapter para multi-instance
```

**Docker Compose:**
```yaml
  redis:
    image: redis:7.2-alpine
    container_name: opentalkwisp-redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass redis_password
```

**Uso en NestJS:**
```typescript
// Cache module
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
          },
          password: process.env.REDIS_PASSWORD,
          ttl: 60 * 60, // 1 hour
        }),
      }),
    }),
  ],
})
export class AppModule {}

// Queue module (Bull)
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'campaigns',
    }),
    BullModule.registerQueue({
      name: 'ai-processing',
    }),
  ],
})
export class QueueModule {}
```

**Casos de uso:**
```typescript
// 1. Cache de queries
@Injectable()
export class ContactsService {
  @CacheKey('contacts-list')
  @CacheTTL(300) // 5 minutes
  async findAll(orgId: string) {
    return this.prisma.contact.findMany({
      where: { organizationId: orgId },
    });
  }
}

// 2. Queue para campañas masivas
@Processor('campaigns')
export class CampaignProcessor {
  @Process('send-message')
  async handleSendMessage(job: Job) {
    const { contactId, message } = job.data;
    await this.whatsappService.sendMessage(contactId, message);
  }
}

// 3. Rate limiting
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post()
async createContact(@Body() dto: CreateContactDto) {
  return this.service.create(dto);
}
```

---

### 7. Autenticación: Passport.js + JWT

**Versiones:**
- `@nestjs/passport: 10.0.3`
- `@nestjs/jwt: 10.2.0`
- `passport-jwt: 4.0.1`
- `bcrypt: 5.1.1`

**Estrategia JWT:**
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  }
}
```

**Tokens:**
```typescript
// Access token (corto)
{
  sub: 'user-uuid',
  email: 'user@example.com',
  organizationId: 'org-uuid',
  role: 'ADMIN',
  iat: 1234567890,
  exp: 1234571490  // 1 hour
}

// Refresh token (largo)
{
  sub: 'user-uuid',
  tokenId: 'refresh-uuid',
  iat: 1234567890,
  exp: 1237159890  // 30 days
}
```

---

### 8. Validación: class-validator + class-transformer

**Versiones:**
- `class-validator: 0.14.1`
- `class-transformer: 0.5.1`

**DTOs con validación:**
```typescript
// src/modules/contacts/dto/create-contact.dto.ts
import { IsString, IsEmail, IsOptional, IsPhoneNumber, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateContactDto {
  @IsPhoneNumber('ZZ') // Universal phone validation
  @Transform(({ value }) => value.trim())
  phoneNumber: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
```

**Global Validation Pipe:**
```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip properties not in DTO
    forbidNonWhitelisted: true, // Throw error if extra props
    transform: true, // Auto transform to DTO class
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

---

### 9. WebSockets: Socket.io

**Versión:** `@nestjs/platform-socket.io: 10.3.0`

**¿Por qué Socket.io?**
```
✅ Fallback automático (WebSocket → polling)
✅ Rooms y namespaces
✅ Broadcast selectivo
✅ Reconexión automática
✅ Redis adapter para multi-instance
✅ Integración nativa con NestJS
```

**Implementación:**
```typescript
// src/modules/conversations/conversations.gateway.ts
import { 
  WebSocketGateway, 
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class ConversationsGateway 
  implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const user = await this.authService.verifyToken(token);
    
    if (!user) {
      client.disconnect();
      return;
    }

    client.data.user = user;
    client.join(`org:${user.organizationId}`);
    
    this.logger.log(`Client ${client.id} connected to org ${user.organizationId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('message:new')
  handleNewMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const orgId = client.data.user.organizationId;
    
    // Broadcast to all clients in the organization
    this.server.to(`org:${orgId}`).emit('message:new', data);
  }
}
```

**Redis Adapter (Multi-instance):**
```typescript
// main.ts
import { RedisIoAdapter } from './adapters/redis-io.adapter';

const app = await NestFactory.create(AppModule);
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

---

### 10. Testing: Jest

**Versión:** `jest: 29.7.0`

**Configuración:**
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
  },
};
```

**Scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

---

## 🎨 FRONTEND STACK

### 1. Framework: Next.js

**Versión:** `14.1.0`

**¿Por qué Next.js 14?**
```
✅ App Router (Server Components)
✅ Server Actions (mutations sin API)
✅ Streaming SSR
✅ Image optimization automática
✅ File-based routing
✅ API routes integradas
✅ Middleware para auth
✅ Excelente SEO
✅ Hot reload rápido (Turbopack)
```

**Instalación:**
```bash
npx create-next-app@14.1.0 frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**Estructura App Router:**
```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── contacts/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── conversations/
│   │   └── page.tsx
│   ├── pipeline/
│   │   └── page.tsx
│   ├── campaigns/
│   │   └── page.tsx
│   └── layout.tsx
├── api/
│   └── [...proxy]/
│       └── route.ts
├── layout.tsx
└── page.tsx
```

---

### 2. UI Library: React

**Versión:** `18.2.0`

**Features usadas:**
```
✅ Hooks (useState, useEffect, useCallback, useMemo)
✅ Context API (para temas, auth)
✅ Suspense (para loading states)
✅ Error Boundaries
✅ Server Components (Next.js 14)
```

---

### 3. Estilos: Tailwind CSS

**Versión:** `3.4.1`

**¿Por qué Tailwind?**
```
✅ Utility-first (desarrollo rápido)
✅ Purge automático (CSS mínimo en producción)
✅ Responsive design simple
✅ Dark mode nativo
✅ Customización total
✅ No naming conflicts
```

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... rest of scale
          900: '#0c4a6e',
        },
        // Custom colors for brand
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};

export default config;
```

---

### 4. Componentes UI: Shadcn/ui

**Versión:** `Latest (components individuales)`

**¿Por qué Shadcn/ui?**
```
✅ Components copiados a tu código (no npm package)
✅ Full customización
✅ Basado en Radix UI (accessible)
✅ Styled con Tailwind
✅ TypeScript native
✅ Dark mode ready
```

**Instalación:**
```bash
npx shadcn-ui@latest init

# Agregar componentes
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
```

**Ejemplo de uso:**
```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

export function CreateContactDialog() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <h2>Create Contact</h2>
        </DialogHeader>
        <form>
          <Input placeholder="Phone number" />
          <Input placeholder="Name" />
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5. Estado Global: Zustand

**Versión:** `4.5.0`

**¿Por qué Zustand vs Redux?**
```
✅ API simple (menos boilerplate)
✅ No providers necesarios
✅ TypeScript friendly
✅ Performance excelente
✅ DevTools integrados
✅ Middleware para persist
```

**Store ejemplo:**
```typescript
// src/lib/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);

// Uso en componente
function Header() {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <span>Welcome, {user?.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### 6. Data Fetching: React Query (TanStack Query)

**Versión:** `5.17.0`

**¿Por qué React Query?**
```
✅ Cache automático de requests
✅ Revalidación en background
✅ Optimistic updates
✅ Infinite scroll fácil
✅ Prefetching
✅ DevTools visuales
✅ Error handling integrado
```

**Setup:**
```typescript
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 3,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Hooks personalizados:**
```typescript
// src/lib/hooks/use-contacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiClient.get('/contacts'),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactDto) => 
      apiClient.post('/contacts', data),
    
    onSuccess: () => {
      // Invalidar y refetch
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    
    onMutate: async (newContact) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      const previousContacts = queryClient.getQueryData(['contacts']);
      
      queryClient.setQueryData(['contacts'], (old: any) => 
        [...old, { id: 'temp', ...newContact }]
      );
      
      return { previousContacts };
    },
    
    onError: (err, newContact, context) => {
      // Rollback en error
      queryClient.setQueryData(['contacts'], context?.previousContacts);
    },
  });
}
```

---

### 7. Forms: React Hook Form

**Versión:** `7.49.3`

**¿Por qué React Hook Form?**
```
✅ Performance (uncontrolled components)
✅ Menos re-renders
✅ Integración con Zod para validation
✅ API simple
✅ TypeScript support excelente
```

**Con Zod validation:**
```typescript
// src/components/contacts/create-contact-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone'),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).default([]),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function CreateContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const createContact = useCreateContact();

  const onSubmit = async (data: ContactFormData) => {
    await createContact.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('phoneNumber')} placeholder="Phone" />
        {errors.phoneNumber && <span>{errors.phoneNumber.message}</span>}
      </div>

      <div>
        <input {...register('name')} placeholder="Name" />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Contact'}
      </button>
    </form>
  );
}
```

---

### 8. Gráficos: Recharts

**Versión:** `2.10.4`

**¿Por qué Recharts?**
```
✅ Componentes React nativos
✅ Responsive automático
✅ Animaciones suaves
✅ Customizable
✅ TypeScript support
```

**Ejemplo:**
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ConversationsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="conversations" 
          stroke="#3b82f6" 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 🤖 INTELIGENCIA ARTIFICIAL STACK

### 1. OpenAI API

**Versión SDK:** `openai: 4.24.1`

**Modelos a usar:**
```
GPT-4 Turbo (gpt-4-turbo-preview):
  - Respuestas complejas
  - Lead scoring
  - Generación de flujos
  
GPT-3.5 Turbo (gpt-3.5-turbo):
  - Respuestas simples
  - Sentiment analysis
  - Clasificación
  
Text Embedding (text-embedding-3-small):
  - Vectores para RAG
  - Búsqueda semántica
```

**Cliente:**
```typescript
// src/modules/ai/providers/openai.provider.ts
import OpenAI from 'openai';

@Injectable()
export class OpenAIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    });
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  }

  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }
}
```

---

### 2. LangChain

**Versión:** `langchain: 0.1.7`

**¿Por qué LangChain?**
```
✅ Orquestación de LLMs
✅ Memory (conversational context)
✅ Chains (pipelines de IA)
✅ Agents (decisiones autónomas)
✅ Vector stores integration
✅ Retry logic
```

**Ejemplo con memoria:**
```typescript
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';

@Injectable()
export class ConversationalAIService {
  
  async chat(conversationId: string, userMessage: string): Promise<string> {
    const model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });

    // Cargar historial de conversación
    const history = await this.getConversationHistory(conversationId);

    const memory = new BufferMemory();
    await memory.chatHistory.addMessages(history);

    const chain = new ConversationChain({
      llm: model,
      memory: memory,
    });

    const response = await chain.call({
      input: userMessage,
    });

    return response.response;
  }
}
```

---

### 3. Pinecone (Vector Database)

**Versión SDK:** `@pinecone-database/pinecone: 2.0.1`

**¿Para qué?**
```
✅ RAG (Retrieval Augmented Generation)
✅ Búsqueda semántica de conversaciones
✅ Knowledge base empresarial
✅ Respuestas basadas en docs internos
```

**Setup:**
```typescript
import { Pinecone } from '@pinecone-database/pinecone';

@Injectable()
export class VectorStoreService {
  private pinecone: Pinecone;
  private index: any;

  async onModuleInit() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    this.index = this.pinecone.Index('opentalkwisp-knowledge');
  }

  async addDocument(orgId: string, document: string, metadata: any) {
    // Generar embedding
    const embedding = await this.openai.createEmbedding(document);

    // Guardar en Pinecone
    await this.index.upsert([
      {
        id: `${orgId}-${Date.now()}`,
        values: embedding,
        metadata: {
          organizationId: orgId,
          content: document,
          ...metadata,
        },
      },
    ]);
  }

  async search(orgId: string, query: string, topK: number = 5) {
    const queryEmbedding = await this.openai.createEmbedding(query);

    const results = await this.index.query({
      vector: queryEmbedding,
      topK,
      filter: {
        organizationId: { $eq: orgId },
      },
      includeMetadata: true,
    });

    return results.matches;
  }
}
```

---

## 📱 WHATSAPP INTEGRATION STACK

### 1. Baileys (QR Code)

**Versión:** `@whiskeysockets/baileys: 6.6.0`

**Implementación:**
```typescript
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';

@Injectable()
export class BaileysProvider implements IWhatsAppProvider {
  private sock: any;

  async connect(instanceId: string) {
    const { state, saveCreds } = await useMultiFileAuthState(
      `./auth-sessions/${instanceId}`
    );

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    this.sock.ev.on('creds.update', saveCreds);
    this.sock.ev.on('messages.upsert', this.handleIncomingMessage);
  }

  async sendMessage(to: string, content: string) {
    await this.sock.sendMessage(to, { text: content });
  }
}
```

---

### 2. Meta WhatsApp Cloud API

**Versión SDK:** `whatsapp: 0.1.0` (custom client)

**Cliente:**
```typescript
import axios from 'axios';

@Injectable()
export class MetaCloudProvider implements IWhatsAppProvider {
  private baseURL = 'https://graph.facebook.com/v18.0';

  async sendMessage(to: string, content: string) {
    await axios.post(
      `${this.baseURL}/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: content },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        },
      },
    );
  }

  async handleWebhook(payload: any) {
    // Process incoming messages
  }
}
```

---

## 🔧 DEVOPS & TOOLS STACK

### 1. Package Manager: pnpm

**Versión:** `8.15.0`

**¿Por qué pnpm?**
```
✅ Más rápido que npm/yarn
✅ Ahorra espacio en disco (hard links)
✅ Workspaces nativos (monorepo)
✅ Strict node_modules (no phantom dependencies)
```

---

### 2. Monorepo: Turborepo

**Versión:** `1.11.3`

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "db:migrate": {
      "cache": false
    }
  }
}
```

---

### 3. Linting: ESLint + Prettier

**Versiones:**
- `eslint: 8.56.0`
- `prettier: 3.2.4`

**Configuración:**
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

---

### 4. Git Hooks: Husky + lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

---

## 📊 RESUMEN FINAL

### Stack Completo

```
Backend:
  ✅ Node.js 20.11.0
  ✅ NestJS 10.3.0
  ✅ TypeScript 5.3.3
  ✅ Prisma 5.8.0
  ✅ PostgreSQL 15.5
  ✅ Redis 7.2
  ✅ Socket.io 4.x
  ✅ Passport JWT
  ✅ Bull (queues)

Frontend:
  ✅ Next.js 14.1.0
  ✅ React 18.2.0
  ✅ TypeScript 5.3.3
  ✅ Tailwind CSS 3.4.1
  ✅ Shadcn/ui
  ✅ Zustand 4.5.0
  ✅ React Query 5.17.0
  ✅ React Hook Form 7.49.3
  ✅ Recharts 2.10.4

AI:
  ✅ OpenAI 4.24.1
  ✅ LangChain 0.1.7
  ✅ Pinecone 2.0.1

WhatsApp:
  ✅ Baileys 6.6.0
  ✅ Meta Cloud API (axios)

DevOps:
  ✅ pnpm 8.15.0
  ✅ Turborepo 1.11.3
  ✅ Docker Compose
  ✅ ESLint + Prettier
  ✅ Jest 29.7.0
```

---

**Siguiente:** `ANALISIS-04-BASE-DE-DATOS.md`

