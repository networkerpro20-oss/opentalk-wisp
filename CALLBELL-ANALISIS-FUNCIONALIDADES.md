# 📊 Análisis de Callbell - Funcionalidades para OpenTalk-WISP

**Fecha**: 11 de diciembre de 2025  
**Objetivo**: Implementar funcionalidades similares a Callbell en OpenTalk-WISP

---

## 🎯 Funcionalidades Clave de Callbell

### 1. **Enrutamiento Automático de Conversaciones** ✅ CRÍTICO

**Lo que tiene Callbell:**
- Asignación automática basada en reglas
- Distribución por equipos
- Round-robin entre agentes
- Asignación basada en disponibilidad
- Reglas por canal (WhatsApp, Telegram, etc.)
- Priorización de conversaciones

**Estado en OpenTalk-WISP:**
- ❌ **NO IMPLEMENTADO**
- ✅ Tenemos la estructura de `users` y `organizations`
- ✅ Tenemos `conversations` con campos para asignación

**Implementación Propuesta:**

```typescript
// 1. Crear tabla de reglas de enrutamiento
model RoutingRule {
  id              String   @id @default(cuid())
  name            String
  organizationId  String
  priority        Int      @default(0)
  isActive        Boolean  @default(true)
  
  // Condiciones
  conditions      Json     // { channel: "WHATSAPP", tags: [], keywords: [] }
  
  // Acciones
  assignmentType  AssignmentType // ROUND_ROBIN, LEAST_BUSY, SPECIFIC_USER, TEAM
  assignToUserId  String?
  assignToTeamId  String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
}

enum AssignmentType {
  ROUND_ROBIN
  LEAST_BUSY
  SPECIFIC_USER
  TEAM
  LOAD_BALANCED
}
```

---

### 2. **Gestión de Equipos** ⚠️ PARCIAL

**Lo que tiene Callbell:**
- Múltiples equipos por organización
- Asignación de agentes a equipos
- Permisos por equipo
- Métricas por equipo
- Disponibilidad de equipo

**Estado en OpenTalk-WISP:**
- ❌ No tenemos tabla de equipos
- ✅ Tenemos `users` con roles

**Implementación Propuesta:**

```typescript
model Team {
  id              String   @id @default(cuid())
  name            String
  description     String?
  organizationId  String
  isActive        Boolean  @default(true)
  
  // Configuración
  maxConcurrentChats  Int  @default(10)
  workingHours        Json // { monday: {start: "09:00", end: "18:00"}, ... }
  
  // Relaciones
  members         TeamMember[]
  conversations   Conversation[]
  routingRules    RoutingRule[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      TeamRole @default(AGENT)
  isActive  Boolean  @default(true)
  
  team      Team     @relation(fields: [teamId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@unique([teamId, userId])
}

enum TeamRole {
  ADMIN
  SUPERVISOR
  AGENT
}
```

---

### 3. **Estados de Agente y Disponibilidad** ❌ NO IMPLEMENTADO

**Lo que tiene Callbell:**
- Estado: Online, Busy, Away, Offline
- Capacidad de chats simultáneos
- Horarios de trabajo
- Pausas programadas
- Notificación de sobrecarga

**Implementación Propuesta:**

```typescript
model UserPresence {
  id              String        @id @default(cuid())
  userId          String        @unique
  status          PresenceStatus @default(OFFLINE)
  customMessage   String?
  
  // Capacidad
  maxConcurrentChats  Int       @default(5)
  currentChats        Int       @default(0)
  
  // Horario
  workingHours    Json          // { monday: {start: "09:00", end: "18:00"}, ... }
  isOnBreak       Boolean       @default(false)
  breakEndsAt     DateTime?
  
  lastSeenAt      DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  user            User          @relation(fields: [userId], references: [id])
}

enum PresenceStatus {
  ONLINE
  BUSY
  AWAY
  OFFLINE
}
```

---

### 4. **Respuestas Rápidas y Templates** ⚠️ PARCIAL

**Lo que tiene Callbell:**
- Respuestas predefinidas
- Shortcuts (atajos de teclado)
- Variables dinámicas: {{nombre}}, {{empresa}}
- Categorización de respuestas
- Uso compartido en equipo
- Estadísticas de uso

**Estado en OpenTalk-WISP:**
- ✅ Tenemos sistema de Flows que puede hacer esto
- ❌ No tenemos respuestas rápidas dedicadas

**Implementación Propuesta:**

```typescript
model QuickReply {
  id              String   @id @default(cuid())
  organizationId  String
  createdById     String
  
  shortcut        String   // /gracias, /horario
  title           String
  content         String   // "Hola {{nombre}}, gracias por contactarnos"
  category        String?  // "Saludos", "Despedidas", "Precios"
  
  isShared        Boolean  @default(true) // Compartir con equipo
  useCount        Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  createdBy       User         @relation(fields: [createdById], references: [id])
  
  @@unique([organizationId, shortcut])
}
```

---

### 5. **Notas Internas y Menciones** ❌ NO IMPLEMENTADO

**Lo que tiene Callbell:**
- Notas privadas en conversaciones
- Menciones @usuario
- Historial de notas
- Notificaciones de menciones
- Búsqueda en notas

**Implementación Propuesta:**

```typescript
model InternalNote {
  id              String   @id @default(cuid())
  conversationId  String
  authorId        String
  content         String
  mentions        String[] // IDs de usuarios mencionados
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  author          User         @relation(fields: [authorId], references: [id])
}
```

---

### 6. **Tags y Etiquetas** ⚠️ PARCIAL

**Lo que tiene Callbell:**
- Tags para conversaciones
- Tags para contactos
- Colores personalizables
- Filtrado por tags
- Auto-tagging con reglas
- Estadísticas por tag

**Estado en OpenTalk-WISP:**
- ✅ `Contact` tiene campo `tags` (String[])
- ❌ No está bien implementado

**Mejora Propuesta:**

```typescript
model Tag {
  id              String   @id @default(cuid())
  name            String
  color           String   @default("#3B82F6")
  organizationId  String
  type            TagType  @default(MANUAL) // MANUAL, AUTO
  
  // Auto-tagging
  autoTagRule     Json?    // { keywords: ["urgent", "importante"] }
  
  conversations   Conversation[]
  contacts        Contact[]
  
  createdAt       DateTime @default(now())
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  
  @@unique([organizationId, name])
}

enum TagType {
  MANUAL
  AUTO
}
```

---

### 7. **Métricas y Analytics** ❌ NO IMPLEMENTADO

**Lo que tiene Callbell:**
- Tiempo de primera respuesta
- Tiempo de resolución
- CSAT (Customer Satisfaction Score)
- Conversaciones por agente
- Conversaciones por canal
- Horas pico de atención
- Tasa de respuesta
- Métricas en tiempo real

**Implementación Propuesta:**

```typescript
model ConversationMetrics {
  id                      String   @id @default(cuid())
  conversationId          String   @unique
  
  // Tiempos
  firstResponseTime       Int?     // segundos
  avgResponseTime         Int?     // segundos
  resolutionTime          Int?     // segundos
  
  // Contadores
  totalMessages           Int      @default(0)
  agentMessages           Int      @default(0)
  customerMessages        Int      @default(0)
  
  // Satisfacción
  csatScore              Int?      // 1-5
  csatComment            String?
  
  // Asignación
  assignedAt             DateTime?
  firstResponseAt        DateTime?
  resolvedAt             DateTime?
  
  conversation           Conversation @relation(fields: [conversationId], references: [id])
}

model AgentMetrics {
  id                    String   @id @default(cuid())
  userId                String
  organizationId        String
  date                  DateTime // Agrupado por día
  
  // Conversaciones
  conversationsHandled  Int      @default(0)
  conversationsClosed   Int      @default(0)
  
  // Tiempos
  avgFirstResponse      Int      @default(0) // segundos
  avgResolution         Int      @default(0) // segundos
  
  // Satisfacción
  avgCsat               Float?
  totalCsatResponses    Int      @default(0)
  
  user                  User     @relation(fields: [userId], references: [id])
  organization          Organization @relation(fields: [organizationId], references: [id])
  
  @@unique([userId, organizationId, date])
}
```

---

### 8. **Bandeja de Entrada Unificada** ✅ IMPLEMENTADO

**Lo que tiene Callbell:**
- Vista consolidada de todos los canales
- Filtros avanzados
- Búsqueda global
- Estado de conversaciones
- Priorización visual

**Estado en OpenTalk-WISP:**
- ✅ Tenemos `conversations` con diferentes canales
- ✅ Frontend tiene vista de conversaciones
- ⚠️ Falta mejorar filtros y búsqueda

---

### 9. **Integración con CRM** ⚠️ PARCIAL

**Lo que tiene Callbell:**
- Sincronización bidireccional
- Webhooks
- API REST completa
- Integración con HubSpot, Salesforce, Pipedrive
- Custom fields sincronizados

**Estado en OpenTalk-WISP:**
- ✅ Tenemos `deals` (pipeline de ventas)
- ✅ Tenemos `contacts`
- ❌ No tenemos webhooks salientes
- ❌ No tenemos sincronización externa

**Implementación Propuesta:**

```typescript
model Webhook {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  url             String
  events          String[] // ["conversation.created", "message.received"]
  isActive        Boolean  @default(true)
  secret          String   // Para firmar payloads
  
  headers         Json?    // Headers personalizados
  
  lastTriggeredAt DateTime?
  failureCount    Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
}

model WebhookLog {
  id              String   @id @default(cuid())
  webhookId       String
  event           String
  payload         Json
  responseStatus  Int?
  responseBody    String?
  error           String?
  
  createdAt       DateTime @default(now())
  
  webhook         Webhook  @relation(fields: [webhookId], references: [id])
}
```

---

### 10. **Chat en Vivo (Widget Web)** ❌ NO IMPLEMENTADO

**Lo que tiene Callbell:**
- Widget embebible
- Customización de colores y textos
- Formulario pre-chat
- Disponibilidad de agentes
- Notificaciones de escritura

**Implementación Propuesta:**

```typescript
model ChatWidget {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  
  // Configuración visual
  primaryColor    String   @default("#3B82F6")
  position        String   @default("bottom-right")
  welcomeMessage  String   @default("¡Hola! ¿En qué podemos ayudarte?")
  
  // Comportamiento
  showWhenOffline Boolean  @default(false)
  preChatForm     Json?    // { fields: [{name: "email", required: true}] }
  
  // Seguridad
  allowedDomains  String[] // ["example.com", "*.example.com"]
  isActive        Boolean  @default(true)
  
  apiKey          String   @unique
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
}
```

---

## 🚀 Plan de Implementación por Fases

### **FASE 1: FUNDAMENTOS (1-2 semanas)** - PRIORIDAD ALTA

1. **Enrutamiento Automático**
   - Crear modelo `RoutingRule`
   - Implementar servicio de enrutamiento
   - Integrar con Bull Queue (ya implementado)
   - UI para configurar reglas

2. **Gestión de Equipos**
   - Crear modelos `Team` y `TeamMember`
   - CRUD de equipos
   - Asignación de usuarios a equipos
   - UI de gestión de equipos

3. **Estados de Agente**
   - Crear modelo `UserPresence`
   - WebSocket para presencia en tiempo real
   - UI de estado de agente
   - Capacidad de chats simultáneos

### **FASE 2: PRODUCTIVIDAD (2-3 semanas)** - PRIORIDAD MEDIA

4. **Respuestas Rápidas**
   - Crear modelo `QuickReply`
   - CRUD de respuestas rápidas
   - Autocompletado con shortcuts
   - Variables dinámicas {{variable}}
   - UI de gestión

5. **Notas Internas**
   - Crear modelo `InternalNote`
   - Sistema de menciones @usuario
   - Notificaciones de menciones
   - UI de notas en conversación

6. **Tags Mejorados**
   - Crear modelo `Tag`
   - Auto-tagging con reglas
   - Filtrado avanzado
   - UI de gestión de tags

### **FASE 3: ANALYTICS (2-3 semanas)** - PRIORIDAD MEDIA

7. **Métricas de Conversaciones**
   - Crear modelos `ConversationMetrics` y `AgentMetrics`
   - Tracking automático de tiempos
   - Dashboard de métricas
   - Reportes exportables

8. **CSAT (Satisfacción del Cliente)**
   - Encuestas post-conversación
   - Almacenamiento de scores
   - Dashboard de CSAT
   - Análisis de tendencias

### **FASE 4: INTEGRACIONES (3-4 semanas)** - PRIORIDAD BAJA

9. **Sistema de Webhooks**
   - Crear modelos `Webhook` y `WebhookLog`
   - Eventos del sistema
   - Firmado de payloads
   - Retry automático
   - UI de configuración

10. **Chat Widget Web**
    - Crear modelo `ChatWidget`
    - Widget JavaScript embebible
    - Configuración visual
    - WebSocket para tiempo real
    - UI de personalización

---

## 📋 Comparación: Callbell vs OpenTalk-WISP Actual

| Funcionalidad | Callbell | OpenTalk-WISP | Prioridad |
|---------------|----------|---------------|-----------|
| WhatsApp Integration | ✅ | ✅ | - |
| Multi-canal (Telegram, Instagram) | ✅ | ❌ | Media |
| Enrutamiento Automático | ✅ | ❌ | **ALTA** |
| Gestión de Equipos | ✅ | ❌ | **ALTA** |
| Estados de Agente | ✅ | ❌ | **ALTA** |
| Respuestas Rápidas | ✅ | ❌ | Media |
| Notas Internas | ✅ | ❌ | Media |
| Tags Avanzados | ✅ | ⚠️ | Media |
| Analytics/Métricas | ✅ | ❌ | Media |
| Webhooks | ✅ | ❌ | Baja |
| Chat Widget Web | ✅ | ❌ | Baja |
| Flows/Automatización | ✅ | ✅ | - |
| AI/Chatbot | ✅ | ✅ | - |
| CRM Básico | ✅ | ✅ | - |

---

## 🎯 Funcionalidades de Callbell que YA TENEMOS

✅ **WhatsApp Integration (Baileys)**
✅ **Conversaciones Multi-canal** (estructura preparada)
✅ **Gestión de Contactos**
✅ **Pipeline de Ventas (Deals)**
✅ **Sistema de Flows Automáticos**
✅ **AI/Chatbot** (OpenAI integration)
✅ **Bull Queue** (procesamiento async)
✅ **Visual Flow Builder** (React Flow)

---

## 💡 Ventajas Competitivas de OpenTalk-WISP

1. **Open Source** - Callbell es propietario
2. **Self-hosted** - Control total de datos
3. **Visual Flow Builder** - Más potente que Callbell
4. **AI Nativa** - Integración profunda con OpenAI
5. **Bull Queue** - Procesamiento robusto y escalable
6. **Stack Moderno** - Next.js + NestJS + Prisma

---

## 📊 Estimación de Esfuerzo

| Fase | Duración | Complejidad | Dependencias |
|------|----------|-------------|--------------|
| Fase 1: Fundamentos | 1-2 semanas | Alta | Bull Queue (✅) |
| Fase 2: Productividad | 2-3 semanas | Media | Fase 1 |
| Fase 3: Analytics | 2-3 semanas | Media | Fase 1 |
| Fase 4: Integraciones | 3-4 semanas | Alta | Fase 1-3 |

**Total estimado:** 8-12 semanas para igualar a Callbell

---

## 🔥 Quick Wins (Implementación Rápida)

### 1. **Respuestas Rápidas** (2-3 días)
- Modelo simple
- UI básica con dropdown
- Autocompletado con /

### 2. **Tags Mejorados** (2-3 días)
- Mejorar modelo existente
- UI de gestión
- Filtrado por tags

### 3. **Notas Internas** (3-4 días)
- Modelo simple
- UI de textarea en conversación
- Sin menciones en v1

### 4. **Estados Básicos de Agente** (3-4 días)
- Online/Offline/Busy
- Almacenar en UserPresence
- Mostrar en UI

---

## 🎨 Mockups de UI Necesarios

### 1. **Configuración de Enrutamiento**
```
┌─────────────────────────────────────────────┐
│ Enrutamiento Automático           [+ Nueva] │
├─────────────────────────────────────────────┤
│                                             │
│ 📝 Regla 1: Mensajes con "urgente"         │
│    └─ Asignar a: Equipo Soporte            │
│    └─ Prioridad: Alta                       │
│    └─ [Editar] [Eliminar] [🟢 Activa]      │
│                                             │
│ 📝 Regla 2: Nuevos contactos               │
│    └─ Asignar a: Round-robin               │
│    └─ Equipo: Ventas                        │
│    └─ [Editar] [Eliminar] [🟢 Activa]      │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. **Vista de Equipos**
```
┌─────────────────────────────────────────────┐
│ Equipos                           [+ Nuevo] │
├─────────────────────────────────────────────┤
│                                             │
│ 👥 Equipo Ventas (5 agentes)               │
│    ├─ 🟢 Juan Pérez (3 chats activos)      │
│    ├─ 🟡 María López (5 chats activos)     │
│    ├─ 🔴 Pedro García (Ocupado)            │
│    └─ ⚫ Ana Martínez (Offline)            │
│                                             │
│ 👥 Equipo Soporte (3 agentes)              │
│    ├─ 🟢 Carlos Ruiz (2 chats activos)     │
│    └─ ...                                   │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. **Respuestas Rápidas**
```
┌─────────────────────────────────────────────┐
│ Respuestas Rápidas               [+ Nueva]  │
├─────────────────────────────────────────────┤
│                                             │
│ /gracias → "Gracias por contactarnos..."   │
│ /horario → "Nuestro horario es..."         │
│ /precio  → "Te envío información..."        │
│                                             │
│ [En conversación: escribe / para usar]     │
└─────────────────────────────────────────────┘
```

---

## 🎯 Próximos Pasos Inmediatos

1. **Revisar y aprobar este análisis** ✅
2. **Decidir qué fase implementar primero** (Recomiendo Fase 1)
3. **Crear migraciones de Prisma para nuevos modelos**
4. **Implementar servicios backend**
5. **Crear componentes de UI en frontend**
6. **Testing y deployment**

---

## 📝 Notas Finales

- **Callbell** es excelente, pero **OpenTalk-WISP puede superarlo**
- La arquitectura actual está bien diseñada para estas mejoras
- **Bull Queue** ya implementado nos da ventaja enorme
- El **Visual Flow Builder** es más potente que el de Callbell
- Podemos diferenciarnos con **AI más profunda** y **open source**

**¿Comenzamos con la Fase 1?** 🚀
