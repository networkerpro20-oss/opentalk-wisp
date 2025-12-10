# 🏢 ANÁLISIS ARQUITECTURA MULTI-TENANT - OpenTalkWisp

**Proyecto:** CRM Omnicanal SaaS Multi-Empresa  
**Fecha:** 10 de diciembre de 2025  
**Documento:** 02 - Arquitectura Multi-Tenant

---

## 🎯 OBJETIVO

Diseñar una arquitectura multi-tenant que permita:
- ✅ Múltiples empresas en la misma infraestructura
- ✅ Aislamiento total de datos entre empresas
- ✅ Escalabilidad de 10 a 10,000+ empresas
- ✅ Mismo dominio inicial con opción a subdominios/dominios custom
- ✅ Performance óptimo sin importar la cantidad de tenants

---

## 📊 ESTRATEGIAS MULTI-TENANT DISPONIBLES

### Comparación de Enfoques

| Estrategia | Aislamiento | Costo | Complejidad | Escalabilidad | Recomendación |
|------------|-------------|-------|-------------|---------------|---------------|
| **Database per Tenant** | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | 🔧🔧🔧🔧 | ⚡⚡⚡ | Enterprise only |
| **Schema per Tenant** | ⭐⭐⭐⭐ | 💰💰💰 | 🔧🔧🔧 | ⚡⚡⚡⚡ | No recomendado |
| **Row-Level (Single DB)** | ⭐⭐⭐ | 💰 | 🔧🔧 | ⚡⚡⚡⚡⚡ | ✅ **RECOMENDADO** |
| **Híbrido** | ⭐⭐⭐⭐ | 💰💰 | 🔧🔧🔧 | ⚡⚡⚡⚡⚡ | Futuro (Scale) |

---

## ✅ ESTRATEGIA ELEGIDA: ROW-LEVEL MULTI-TENANCY

### ¿Por qué Row-Level?

**Ventajas:**
```
✅ Costo mínimo - Una sola base de datos
✅ Mantenimiento simple - Un schema, una migración
✅ Backup centralizado - Backup único para todos
✅ Escalabilidad inicial excelente (hasta 5,000 tenants)
✅ Queries eficientes con índices correctos
✅ Desarrollo más rápido
```

**Desventajas (Manejables):**
```
⚠️ Riesgo teórico de leak de datos (mitigado con middleware)
⚠️ Queries deben siempre filtrar por organizationId
⚠️ Performance puede degradarse con millones de rows
⚠️ Backups son "todo o nada"
```

### Arquitectura Visual

```
┌─────────────────────────────────────────────────────┐
│              APLICACIÓN NESTJS                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │      Tenant Middleware / Guard               │  │
│  │  (Extrae organizationId de JWT/subdomain)    │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                 │
│  ┌────────────────▼─────────────────────────────┐  │
│  │        Prisma Middleware                     │  │
│  │  (Auto-inyecta organizationId en queries)    │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                 │
└───────────────────┼─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│           POSTGRESQL DATABASE                       │
│                                                     │
│  organizations                                      │
│  ├── id: uuid                                       │
│  ├── subdomain: "acme", "startup-x"                 │
│  └── settings: jsonb                                │
│                                                     │
│  contacts                                           │
│  ├── id: uuid                                       │
│  ├── organization_id: uuid ← TENANT KEY             │
│  ├── phone_number: string                           │
│  └── ...                                            │
│                                                     │
│  conversations                                      │
│  ├── id: uuid                                       │
│  ├── organization_id: uuid ← TENANT KEY             │
│  └── ...                                            │
│                                                     │
│  [Todas las tablas tienen organization_id]         │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### 1. Schema de Base de Datos (Prisma)

```prisma
// prisma/schema.prisma

model Organization {
  id        String   @id @default(uuid())
  name      String
  subdomain String   @unique  // acme, startup-x
  domain    String?  @unique  // custom: acme.com
  
  // Plan y límites
  plan      PlanType @default(FREE)
  maxUsers  Int      @default(5)
  maxContacts Int    @default(1000)
  
  // Features habilitadas
  features  Json     @default("{}")
  
  // Configuración
  settings  Json     @default("{}")
  
  // Status
  status    OrgStatus @default(ACTIVE)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relaciones
  users         User[]
  contacts      Contact[]
  conversations Conversation[]
  campaigns     Campaign[]
  pipelines     Pipeline[]
  whatsappInstances WhatsAppInstance[]
  
  @@index([subdomain])
  @@index([status])
}

enum PlanType {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum OrgStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CANCELLED
}

// =============================================
// Todas las entidades tienen organizationId
// =============================================

model User {
  id             String   @id @default(uuid())
  organizationId String   // ← Multi-tenant key
  
  email          String
  password       String
  name           String
  role           UserRole @default(AGENT)
  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([email, organizationId])
  @@index([organizationId])
}

model Contact {
  id             String   @id @default(uuid())
  organizationId String   // ← Multi-tenant key
  
  phoneNumber    String
  name           String?
  email          String?
  tags           String[] @default([])
  customFields   Json     @default("{}")
  
  leadScore      Int      @default(0)
  leadStatus     LeadStatus @default(NEW)
  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  conversations  Conversation[]
  deals          Deal[]
  
  @@unique([phoneNumber, organizationId])
  @@index([organizationId])
  @@index([organizationId, leadStatus])
  @@index([organizationId, leadScore])
}

model Conversation {
  id             String   @id @default(uuid())
  organizationId String   // ← Multi-tenant key
  
  contactId      String
  assignedToId   String?
  status         ConversationStatus @default(OPEN)
  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contact        Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  messages       Message[]
  
  @@index([organizationId])
  @@index([organizationId, status])
  @@index([contactId])
}

model Message {
  id             String   @id @default(uuid())
  organizationId String   // ← Multi-tenant key
  
  conversationId String
  content        String
  direction      MessageDirection
  status         MessageStatus
  
  aiGenerated    Boolean  @default(false)
  sentiment      String?
  
  createdAt      DateTime @default(now())
  
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId])
  @@index([conversationId])
  @@index([organizationId, createdAt])
}

// Más modelos... todos con organizationId
```

### 2. Middleware de Aislamiento (NestJS)

```typescript
// src/core/interceptors/tenant.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extraer organizationId del JWT o subdomain
    const user = request.user; // Desde JWT
    const organizationId = user?.organizationId;
    
    if (!organizationId) {
      throw new UnauthorizedException('Organization context required');
    }
    
    // Inyectar en request para uso en servicios
    request.organizationId = organizationId;
    
    return next.handle();
  }
}
```

### 3. Prisma Middleware (Auto-filter)

```typescript
// src/infrastructure/database/prisma.service.ts

import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  
  async onModuleInit() {
    await this.$connect();
    
    // ===================================================
    // MIDDLEWARE CRÍTICO: Auto-filtrado por tenant
    // ===================================================
    this.$use(async (params, next) => {
      // Obtener organizationId del contexto (AsyncLocalStorage)
      const organizationId = this.getOrganizationId();
      
      if (!organizationId) {
        throw new Error('Organization context missing');
      }
      
      // Modelos que usan multi-tenancy
      const multiTenantModels = [
        'User', 'Contact', 'Conversation', 'Message', 
        'Campaign', 'Pipeline', 'Deal', 'WhatsAppInstance'
      ];
      
      if (multiTenantModels.includes(params.model)) {
        // READ operations - auto-filter
        if (params.action === 'findMany' || params.action === 'findFirst') {
          params.args.where = {
            ...params.args.where,
            organizationId,
          };
        }
        
        // CREATE operations - auto-inject
        if (params.action === 'create') {
          params.args.data = {
            ...params.args.data,
            organizationId,
          };
        }
        
        // UPDATE/DELETE - verificar ownership
        if (params.action === 'update' || params.action === 'delete') {
          params.args.where = {
            ...params.args.where,
            organizationId,
          };
        }
      }
      
      return next(params);
    });
  }
  
  private getOrganizationId(): string | null {
    // Implementar con AsyncLocalStorage o request context
    // Ver: https://docs.nestjs.com/fundamentals/execution-context
    return AsyncContext.get('organizationId');
  }
}
```

### 4. Guard de Autorización Multi-Tenant

```typescript
// src/core/guards/tenant.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Del JWT
    
    // Si hay un organizationId en params, validar que coincida
    const requestedOrgId = request.params.organizationId;
    
    if (requestedOrgId && requestedOrgId !== user.organizationId) {
      throw new ForbiddenException(
        'You do not have access to this organization'
      );
    }
    
    // Inyectar en contexto
    AsyncContext.set('organizationId', user.organizationId);
    
    return true;
  }
}
```

---

## 🌐 ESTRATEGIA DE DOMINIOS Y SUBDOMÍNIOS

### Fase 1: Mismo Dominio (MVP)
```
https://app.opentalkwisp.com
  - Todas las empresas acceden aquí
  - Login → identifica organization por email
  - URL: /dashboard (no subdomain)
```

**Ventajas:**
- Simple de implementar
- Un solo certificado SSL
- Menor complejidad DNS

### Fase 2: Subdomínios (Growth)
```
https://acme.opentalkwisp.com
https://startup-x.opentalkwisp.com
```

**Implementación:**
```typescript
// src/core/middleware/subdomain.middleware.ts

@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const host = req.get('host'); // acme.opentalkwisp.com
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
      // Buscar organization por subdomain
      const org = await this.orgService.findBySubdomain(subdomain);
      
      if (org) {
        req.organizationId = org.id;
      } else {
        throw new NotFoundException('Organization not found');
      }
    }
    
    next();
  }
}
```

**DNS Configuration:**
```
Wildcard subdomain:
*.opentalkwisp.com → CNAME → app.opentalkwisp.com
```

### Fase 3: Dominios Custom (Enterprise)
```
https://crm.acme.com (custom domain)
```

**Implementación:**
```typescript
model Organization {
  // ...
  customDomain String? @unique // crm.acme.com
  sslCertificate String? // Let's Encrypt auto
}

// Lookup por domain
@Get()
async identifyOrganization(@Req() req) {
  const host = req.get('host');
  
  // Buscar por custom domain o subdomain
  const org = await this.orgService.findByDomain(host);
  
  return org;
}
```

**DNS Cliente (CNAME):**
```
crm.acme.com → CNAME → proxy.opentalkwisp.com
```

**SSL Automation:**
- Let's Encrypt con certbot
- Renovación automática
- Wildcard certificates

---

## 🔐 AISLAMIENTO Y SEGURIDAD

### 1. Índices para Performance

```sql
-- Índices compuestos críticos
CREATE INDEX idx_contacts_org_phone ON contacts(organization_id, phone_number);
CREATE INDEX idx_contacts_org_status ON contacts(organization_id, lead_status);
CREATE INDEX idx_conversations_org_status ON conversations(organization_id, status);
CREATE INDEX idx_messages_org_created ON messages(organization_id, created_at DESC);
CREATE INDEX idx_users_org_email ON users(organization_id, email);

-- Índices para búsquedas
CREATE INDEX idx_contacts_org_name ON contacts(organization_id, name);
CREATE INDEX idx_contacts_org_tags ON contacts USING GIN(organization_id, tags);
```

### 2. Row-Level Security (PostgreSQL Native)

```sql
-- Habilitar RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política: Solo acceso a tu organización
CREATE POLICY tenant_isolation_policy ON contacts
  USING (organization_id = current_setting('app.current_organization')::uuid);

-- Configurar en cada request
SET app.current_organization = 'org-uuid-here';
```

### 3. Tests de Aislamiento

```typescript
// tests/tenant-isolation.spec.ts

describe('Tenant Isolation', () => {
  it('should not allow access to other org contacts', async () => {
    // Crear 2 organizaciones
    const org1 = await createOrganization('Org 1');
    const org2 = await createOrganization('Org 2');
    
    // Crear contacto en org1
    const contact = await createContact(org1.id, {
      phoneNumber: '+1234567890',
      name: 'John Doe',
    });
    
    // Intentar acceder desde org2
    const result = await request(app.getHttpServer())
      .get(`/contacts/${contact.id}`)
      .set('Authorization', `Bearer ${org2Token}`)
      .expect(403); // Forbidden
    
    expect(result.body.error).toBe('Forbidden');
  });
  
  it('should auto-filter queries by organization', async () => {
    const org1 = await createOrganization('Org 1');
    const org2 = await createOrganization('Org 2');
    
    // Crear contactos en ambas
    await createContact(org1.id, { name: 'Contact Org 1' });
    await createContact(org2.id, { name: 'Contact Org 2' });
    
    // Query desde org1
    const contacts = await contactService.findAll(org1.id);
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe('Contact Org 1');
  });
});
```

---

## 📊 PLANES Y LÍMITES

### Tabla de Planes

```typescript
// src/modules/organizations/types/plans.types.ts

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      users: 2,
      contacts: 500,
      messagesPerMonth: 1000,
      whatsappInstances: 1,
      aiCredits: 100,
      campaigns: 5,
      flows: 3,
      storage: '1 GB',
    },
    features: {
      crm: true,
      conversations: true,
      basicReports: true,
      aiBasic: true,
      campaigns: true,
      flows: false,
      customFields: false,
      apiAccess: false,
      webhooks: false,
      whiteLabel: false,
    },
  },
  
  STARTER: {
    name: 'Starter',
    price: 49,
    limits: {
      users: 5,
      contacts: 5000,
      messagesPerMonth: 10000,
      whatsappInstances: 2,
      aiCredits: 1000,
      campaigns: 'unlimited',
      flows: 10,
      storage: '10 GB',
    },
    features: {
      crm: true,
      conversations: true,
      advancedReports: true,
      aiAdvanced: true,
      campaigns: true,
      flows: true,
      customFields: true,
      apiAccess: true,
      webhooks: true,
      whiteLabel: false,
    },
  },
  
  PROFESSIONAL: {
    name: 'Professional',
    price: 149,
    limits: {
      users: 20,
      contacts: 50000,
      messagesPerMonth: 100000,
      whatsappInstances: 10,
      aiCredits: 10000,
      campaigns: 'unlimited',
      flows: 'unlimited',
      storage: '100 GB',
    },
    features: {
      crm: true,
      conversations: true,
      advancedReports: true,
      aiAdvanced: true,
      campaigns: true,
      flows: true,
      customFields: true,
      apiAccess: true,
      webhooks: true,
      whiteLabel: true,
      customDomain: true,
      prioritySupport: true,
    },
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    price: 499,
    limits: {
      users: 'unlimited',
      contacts: 'unlimited',
      messagesPerMonth: 'unlimited',
      whatsappInstances: 'unlimited',
      aiCredits: 'unlimited',
      campaigns: 'unlimited',
      flows: 'unlimited',
      storage: '1 TB',
    },
    features: {
      // All features +
      dedicatedDatabase: true,
      sla: true,
      dedicatedSupport: true,
      onboarding: true,
      customIntegrations: true,
    },
  },
};
```

### Enforcement de Límites

```typescript
// src/core/guards/limits.guard.ts

@Injectable()
export class LimitsGuard implements CanActivate {
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const org = await this.getOrganization(request.organizationId);
    
    const resourceType = this.getResourceType(context); // 'contacts', 'users', etc
    
    // Verificar límite
    const currentCount = await this.getResourceCount(org.id, resourceType);
    const limit = PLANS[org.plan].limits[resourceType];
    
    if (limit !== 'unlimited' && currentCount >= limit) {
      throw new ForbiddenException(
        `Plan limit reached: ${resourceType}. Upgrade to continue.`
      );
    }
    
    return true;
  }
}

// Uso en controlador
@Post()
@UseGuards(TenantGuard, LimitsGuard)
@ResourceType('contacts') // Decorator custom
async createContact(@Body() dto: CreateContactDto) {
  return this.contactsService.create(dto);
}
```

---

## 🔄 MIGRACIÓN ENTRE ESTRATEGIAS

### Path de Evolución

```
Fase 1 (0-1,000 orgs):
  ┌─────────────────────────┐
  │  Single PostgreSQL DB   │
  │  Row-Level Multi-Tenant │
  └─────────────────────────┘

Fase 2 (1,000-10,000 orgs):
  ┌─────────────────────────┐
  │  Partitioned Tables     │
  │  By Organization ID     │
  └─────────────────────────┘

Fase 3 (10,000+ orgs):
  ┌───────────┐  ┌───────────┐
  │  DB Pool  │  │  DB Pool  │
  │  Orgs     │  │  Orgs     │
  │  1-5000   │  │  5001+    │
  └───────────┘  └───────────┘
  
  Enterprise Clients:
  ┌───────────┐
  │ Dedicated │
  │ Database  │
  └───────────┘
```

### Particionamiento Futuro (Si es necesario)

```sql
-- Particionar tabla contacts por organization_id
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  ...
) PARTITION BY HASH (organization_id);

-- Crear particiones
CREATE TABLE contacts_p0 PARTITION OF contacts
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
  
CREATE TABLE contacts_p1 PARTITION OF contacts
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
  
-- etc...
```

---

## 🎯 RECOMENDACIONES FINALES

### Para MVP (Primeros 6 meses)
```
✅ Row-Level Multi-Tenancy
✅ Single Domain (app.opentalkwisp.com)
✅ JWT con organizationId
✅ Prisma Middleware para auto-filtrado
✅ Índices compuestos
```

### Para Growth (6-18 meses)
```
✅ Subdomains (acme.opentalkwisp.com)
✅ Wildcard SSL
✅ Particionamiento de tablas grandes
✅ Read replicas para reportes
```

### Para Scale (18+ meses)
```
✅ Custom domains para Enterprise
✅ Database per tenant para clientes grandes
✅ Multi-region deployment
✅ Caching agresivo con Redis
```

---

## 📈 MÉTRICAS DE ÉXITO

| Métrica | Target | Cómo Medir |
|---------|--------|------------|
| Query Performance | <100ms p95 | PostgreSQL slow query log |
| Data Isolation | 100% | Tests automáticos |
| Onboarding Time | <5 min | Tiempo promedio signup → primer mensaje |
| Scalability | 10,000 orgs sin degradación | Load testing |
| Cost per Tenant | <$0.10/mes | Infra cost / total orgs |

---

## ✅ CONCLUSIÓN

La arquitectura **Row-Level Multi-Tenancy** es:
- ✅ Óptima para el proyecto
- ✅ Cost-effective
- ✅ Escalable hasta 5,000-10,000 organizaciones
- ✅ Fácil de implementar y mantener
- ✅ Path claro de evolución

**Next Steps:** Ver `ANALISIS-03-STACK-TECNOLOGICO.md`

