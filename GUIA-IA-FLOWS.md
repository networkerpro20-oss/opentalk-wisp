# 🤖 Módulo de IA y Flujos Automáticos

## 📋 Índice

1. [Introducción](#introducción)
2. [Módulo de IA](#módulo-de-ia)
3. [Motor de Flujos (Flows)](#motor-de-flujos)
4. [API Endpoints](#api-endpoints)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Configuración](#configuración)
7. [Arquitectura](#arquitectura)

---

## 🎯 Introducción

Tu CRM ahora incluye dos módulos poderosos que trabajan juntos:

### 🧠 Módulo de IA
Análisis inteligente de conversaciones:
- **Análisis de Sentimiento**: Detecta emociones (positivo/negativo/neutral)
- **Lead Scoring**: Califica contactos del 0 al 100 (HOT/WARM/COLD)
- **Respuestas Automáticas**: Genera respuestas con GPT-3.5 o fallback
- **Extracción de Información**: Captura nombres, emails, teléfonos

### 🤖 Motor de Flujos
Automatización visual de procesos:
- **Triggers**: NEW_MESSAGE, NEW_CONTACT, TAG_ADDED, DEAL_STAGE_CHANGE
- **Nodos**: Condiciones, Acciones, IA, Esperas
- **Ejecución Automática**: Se activan solos cuando ocurre el trigger
- **Variables Dinámicas**: Personaliza mensajes con {{nombreVariable}}

---

## 🧠 Módulo de IA

### Análisis de Sentimiento

**¿Qué hace?**
Analiza el tono emocional de un mensaje y devuelve:
- Sentimiento general (POSITIVE, NEUTRAL, NEGATIVE)
- Score numérico (-1 a 1)
- Confianza de la predicción (0 a 1)
- Emociones detectadas (alegría, tristeza, enojo, miedo, interés)

**Endpoint:**
```http
POST /api/ai/sentiment
Content-Type: application/json

{
  "text": "¡Muchas gracias! Excelente servicio, estoy muy feliz con mi compra"
}
```

**Respuesta:**
```json
{
  "sentiment": "POSITIVE",
  "score": 0.85,
  "confidence": 0.92,
  "emotions": {
    "joy": 0.9,
    "sadness": 0.1,
    "anger": 0.05,
    "fear": 0.05,
    "interest": 0.7
  }
}
```

**Casos de Uso:**
- Detectar clientes insatisfechos automáticamente
- Priorizar conversaciones negativas
- Medir satisfacción del cliente
- Entrenar modelos propios

---

### Lead Scoring Inteligente

**¿Qué hace?**
Calcula un score de 0 a 100 para cada contacto basándose en:
1. **Engagement** (20 pts): Cantidad de mensajes intercambiados
2. **Sentiment** (20 pts): Sentimiento promedio de sus mensajes
3. **Response Time** (20 pts): Qué tan rápido responde
4. **Message Frequency** (20 pts): Frecuencia de comunicación
5. **Deal Potential** (20 pts): Valor de deals abiertos

**Categorías:**
- 🔥 **HOT** (70-100): Contactar inmediatamente
- 🌡️ **WARM** (40-69): Mantener comunicación regular
- ❄️ **COLD** (0-39): Requiere nurturing

**Endpoint:**
```http
GET /api/ai/lead-score/:contactId
```

**Respuesta:**
```json
{
  "score": 78,
  "category": "HOT",
  "factors": {
    "engagement": 18,
    "sentiment": 16,
    "responseTime": 19,
    "messageFrequency": 15,
    "dealPotential": 10
  },
  "recommendation": "Contactar inmediatamente. Alta probabilidad de conversión."
}
```

**Casos de Uso:**
- Priorizar seguimiento de ventas
- Identificar clientes VIP automáticamente
- Asignar leads a vendedores según score
- Dashboard de oportunidades calientes

---

### Respuestas Automáticas

**¿Qué hace?**
Genera respuestas inteligentes usando GPT-3.5 (con fallback sin API):
- Responde preguntas frecuentes
- Captura información del cliente
- Califica leads
- Agenda citas
- Mantiene conversaciones naturales

**Endpoint:**
```http
POST /api/ai/auto-response
Content-Type: application/json

{
  "messageText": "Hola, quisiera saber los precios de sus productos",
  "context": [
    "Hola! Bienvenido",
    "Gracias por contactarnos"
  ]
}
```

**Respuesta:**
```json
{
  "response": "¡Gracias por tu interés! Te compartiré información sobre nuestros precios. ¿Podrías decirme qué servicio específico te interesa?",
  "confidence": 0.85,
  "suggestedActions": [
    "Enviar catálogo de precios",
    "Agendar llamada"
  ],
  "needsHumanReview": false
}
```

**Configuración con OpenAI:**
```bash
# En Render, agregar variable de entorno:
OPENAI_API_KEY=sk-...tu-api-key
```

**Sin API (Fallback):**
Funciona automáticamente con respuestas predefinidas:
- Saludos
- Preguntas de precios
- Horarios
- Respuesta genérica

---

### Extracción de Información

**¿Qué hace?**
Extrae datos estructurados de texto libre:
- Nombres
- Emails
- Teléfonos
- Empresas

**Endpoint:**
```http
POST /api/ai/extract-info
Content-Type: application/json

{
  "text": "Hola, soy Juan Pérez de Acme Corp. Mi email es juan@acme.com y mi teléfono es +57 300 123 4567"
}
```

**Respuesta:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@acme.com",
  "phone": "+57 300 123 4567",
  "company": "Acme Corp"
}
```

---

## 🤖 Motor de Flujos (Flows)

### ¿Qué es un Flow?

Un **Flow** es una secuencia de pasos automatizados que se ejecutan cuando ocurre un evento (trigger).

**Componentes:**
1. **Trigger**: Evento que inicia el flow
2. **Nodes**: Pasos del flujo (condiciones, acciones, IA)
3. **Edges**: Conexiones entre nodos
4. **Variables**: Datos dinámicos que fluyen entre nodos

---

### Tipos de Triggers

```typescript
enum FlowTrigger {
  NEW_CONTACT = 'NEW_CONTACT',       // Cuando se crea un contacto
  NEW_MESSAGE = 'NEW_MESSAGE',       // Cuando llega un mensaje
  TAG_ADDED = 'TAG_ADDED',           // Cuando se agrega un tag
  DEAL_STAGE_CHANGE = 'DEAL_STAGE_CHANGE' // Cuando cambia etapa de deal
}
```

**Triggers Activos:**
Los flows con trigger `NEW_MESSAGE` se ejecutan automáticamente cuando llega un mensaje de WhatsApp.

---

### Tipos de Nodos

#### 1. Nodo Trigger (Inicio)
```json
{
  "id": "trigger-1",
  "type": "trigger",
  "data": {
    "trigger": "NEW_MESSAGE"
  }
}
```

#### 2. Nodo Condición
```json
{
  "id": "condition-1",
  "type": "condition",
  "data": {
    "field": "messageText",
    "operator": "contains",
    "value": "precio"
  }
}
```

**Operadores disponibles:**
- `equals`: Igual a
- `contains`: Contiene
- `greater_than`: Mayor que
- `less_than`: Menor que
- `is_empty`: Está vacío

#### 3. Nodo Acción
```json
{
  "id": "action-1",
  "type": "action",
  "data": {
    "action": "send_message",
    "message": "Hola {{contactName}}, gracias por escribir!"
  }
}
```

**Acciones disponibles:**
- `send_message`: Enviar mensaje de WhatsApp
- `send_media`: Enviar imagen/video/documento
- `add_tag`: Agregar tag al contacto
- `create_deal`: Crear oportunidad de venta
- `assign_user`: Asignar conversación a usuario
- `update_field`: Actualizar campo del contacto

#### 4. Nodo IA
```json
{
  "id": "ai-1",
  "type": "ai",
  "data": {
    "aiAction": "analyze_sentiment"
  }
}
```

**Acciones de IA:**
- `analyze_sentiment`: Analizar sentimiento del mensaje
- `generate_response`: Generar respuesta automática (y enviar si confidence > 0.7)
- `calculate_lead_score`: Calcular score del lead
- `extract_info`: Extraer información y actualizar contacto

#### 5. Nodo Espera
```json
{
  "id": "wait-1",
  "type": "wait",
  "data": {
    "duration": 5,
    "unit": "minutes"
  }
}
```

**Unidades de tiempo:**
- `seconds`
- `minutes`
- `hours`
- `days`

#### 6. Nodo End (Fin)
```json
{
  "id": "end-1",
  "type": "end",
  "data": {}
}
```

---

### Crear un Flow

**Endpoint:**
```http
POST /api/flows
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Respuesta Automática de Precios",
  "description": "Responde automáticamente cuando alguien pregunta por precios",
  "trigger": "NEW_MESSAGE",
  "isActive": true,
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "data": { "trigger": "NEW_MESSAGE" },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "condition-1",
      "type": "condition",
      "data": {
        "field": "messageText",
        "operator": "contains",
        "value": "precio"
      },
      "position": { "x": 0, "y": 100 }
    },
    {
      "id": "action-1",
      "type": "action",
      "data": {
        "action": "send_message",
        "message": "Hola {{contactName}}! Con gusto te envío nuestros precios. ¿Qué producto te interesa?"
      },
      "position": { "x": 0, "y": 200 }
    },
    {
      "id": "action-2",
      "type": "action",
      "data": {
        "action": "add_tag",
        "tag": "Interesado en Precios"
      },
      "position": { "x": 0, "y": 300 }
    },
    {
      "id": "end-1",
      "type": "end",
      "data": {},
      "position": { "x": 0, "y": 400 }
    }
  ],
  "edges": [
    { "id": "e1", "source": "trigger-1", "target": "condition-1" },
    { "id": "e2", "source": "condition-1", "target": "action-1", "sourceHandle": "true" },
    { "id": "e3", "source": "action-1", "target": "action-2" },
    { "id": "e4", "source": "action-2", "target": "end-1" }
  ]
}
```

---

### Gestión de Flows

**Listar Flows:**
```http
GET /api/flows
```

**Obtener un Flow:**
```http
GET /api/flows/:id
```

**Actualizar Flow:**
```http
PATCH /api/flows/:id
```

**Eliminar Flow:**
```http
DELETE /api/flows/:id
```

**Activar/Desactivar:**
```http
POST /api/flows/:id/toggle
```

**Probar Flow:**
```http
POST /api/flows/:id/test
Content-Type: application/json

{
  "contactId": "contact-123",
  "conversationId": "conv-456",
  "messageId": "msg-789",
  "variables": {
    "messageText": "cuánto cuesta",
    "contactName": "Juan"
  }
}
```

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Bienvenida Automática

```json
{
  "name": "Bienvenida a Nuevos Contactos",
  "trigger": "NEW_CONTACT",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger"
    },
    {
      "id": "wait",
      "type": "wait",
      "data": { "duration": 5, "unit": "seconds" }
    },
    {
      "id": "message",
      "type": "action",
      "data": {
        "action": "send_message",
        "message": "¡Hola! 👋 Bienvenido/a a [Tu Empresa]. ¿En qué puedo ayudarte hoy?"
      }
    },
    {
      "id": "tag",
      "type": "action",
      "data": {
        "action": "add_tag",
        "tag": "Nuevo"
      }
    }
  ],
  "edges": [...]
}
```

---

### Ejemplo 2: Calificación Automática con IA

```json
{
  "name": "Calificar Leads Automáticamente",
  "trigger": "NEW_MESSAGE",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger"
    },
    {
      "id": "sentiment",
      "type": "ai",
      "data": {
        "aiAction": "analyze_sentiment"
      }
    },
    {
      "id": "score",
      "type": "ai",
      "data": {
        "aiAction": "calculate_lead_score"
      }
    },
    {
      "id": "condition",
      "type": "condition",
      "data": {
        "field": "leadCategory",
        "operator": "equals",
        "value": "HOT"
      }
    },
    {
      "id": "notify",
      "type": "action",
      "data": {
        "action": "assign_user",
        "userId": "user-ventas-1"
      }
    }
  ],
  "edges": [...]
}
```

---

### Ejemplo 3: Respuesta Automática Inteligente

```json
{
  "name": "Auto-responder con IA",
  "trigger": "NEW_MESSAGE",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger"
    },
    {
      "id": "extract-info",
      "type": "ai",
      "data": {
        "aiAction": "extract_info"
      }
    },
    {
      "id": "generate-response",
      "type": "ai",
      "data": {
        "aiAction": "generate_response"
      }
    }
  ],
  "edges": [...]
}
```

**Nota**: El nodo `generate_response` envía automáticamente la respuesta si `confidence > 0.7` y `needsHumanReview = false`.

---

### Ejemplo 4: Seguimiento Post-Venta

```json
{
  "name": "Seguimiento a 24 horas",
  "trigger": "DEAL_STAGE_CHANGE",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger"
    },
    {
      "id": "wait",
      "type": "wait",
      "data": { "duration": 24, "unit": "hours" }
    },
    {
      "id": "message",
      "type": "action",
      "data": {
        "action": "send_message",
        "message": "Hola {{contactName}}! ¿Cómo va todo con tu pedido? ¿Hay algo en lo que pueda ayudarte?"
      }
    },
    {
      "id": "media",
      "type": "action",
      "data": {
        "action": "send_media",
        "mediaType": "image",
        "mediaUrl": "https://ejemplo.com/encuesta-satisfaccion.jpg",
        "caption": "Nos encantaría conocer tu opinión 📋"
      }
    }
  ],
  "edges": [...]
}
```

---

## ⚙️ Configuración

### Variables de Entorno

```bash
# OpenAI (opcional, usa fallback si no está)
OPENAI_API_KEY=sk-...

# Base de datos
DATABASE_URL=postgresql://...

# Frontend
FRONTEND_URL=https://tu-app.vercel.app
```

### Activar OpenAI

1. Obtener API key: https://platform.openai.com/api-keys
2. Agregar en Render:
   ```
   Dashboard → opentalk-backend → Environment → Add Environment Variable
   OPENAI_API_KEY = sk-...
   ```
3. Redesplegar: Manual Deploy → Deploy Latest Commit

**Costos de OpenAI:**
- GPT-3.5-turbo: ~$0.002 por 1000 tokens
- Para 1000 mensajes/mes: ~$2-5 USD

---

## 🏗️ Arquitectura

### Flujo de Ejecución

```
WhatsApp Message
     ↓
WhatsappService.handleIncomingMessage()
     ↓
Guardar en BD (Message, Contact, Conversation)
     ↓
FlowEngineService.executeTrigger('NEW_MESSAGE')
     ↓
Buscar Flows con trigger='NEW_MESSAGE' y status='ACTIVE'
     ↓
Para cada Flow:
  ├─ Ejecutar nodo por nodo
  ├─ Evaluar condiciones
  ├─ Ejecutar acciones (enviar mensaje, agregar tag)
  ├─ Llamar IA si es necesario
  └─ Continuar hasta nodo END
```

### Estructura de Módulos

```
apps/backend/src/
├── ai/
│   ├── ai.module.ts
│   ├── ai.service.ts          # Lógica de IA
│   ├── ai.controller.ts       # Endpoints HTTP
│   └── dto/
│       ├── analyze-sentiment.dto.ts
│       └── generate-response.dto.ts
│
├── flows/
│   ├── flows.module.ts
│   ├── flows.service.ts       # CRUD de flows
│   ├── flows.controller.ts    # Endpoints HTTP
│   ├── flow-engine.service.ts # Motor de ejecución
│   └── dto/
│       ├── create-flow.dto.ts
│       └── update-flow.dto.ts
│
└── whatsapp/
    ├── whatsapp.module.ts     # Ahora importa FlowsModule
    └── whatsapp.service.ts    # Ejecuta flows en handleIncomingMessage
```

### Base de Datos

```sql
-- Tabla flows
CREATE TABLE flows (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  trigger ENUM('NEW_CONTACT', 'NEW_MESSAGE', 'TAG_ADDED', 'DEAL_STAGE_CHANGE'),
  status ENUM('ACTIVE', 'INACTIVE'),
  config JSONB,  -- {nodes: [...], edges: [...], description: "..."}
  organization_id UUID NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_flows_org_trigger ON flows(organization_id, trigger);
CREATE INDEX idx_flows_status ON flows(status);
```

---

## 🎨 Editor Visual de Flows (Frontend)

### Próxima Implementación

Se creará un editor visual usando **React Flow** que permita:

- Arrastrar y soltar nodos
- Conectar nodos visualmente
- Configurar cada nodo con un panel lateral
- Probar flows en tiempo real
- Ver historial de ejecuciones

**Tecnologías:**
- `@xyflow/react` (React Flow v12)
- Zustand para estado
- TailwindCSS para estilos

**Ubicación:**
```
apps/frontend/src/app/dashboard/flows/
├── page.tsx              # Lista de flows
├── [id]/
│   ├── page.tsx          # Editor visual
│   └── components/
│       ├── FlowCanvas.tsx
│       ├── NodePalette.tsx
│       └── NodeConfig.tsx
```

---

## 📈 Métricas y Monitoreo

### Logs

```typescript
// Ver logs en Render
Dashboard → opentalk-backend → Logs

// Buscar ejecuciones de flows
Starting flow execution: flow-123
Executing node: trigger-1 (trigger)
Executing node: condition-1 (condition)
Flow execution completed: flow-123
```

### Base de Datos

```sql
-- Mensajes procesados por IA
SELECT 
  COUNT(*) as total,
  AVG(sentiment_score) as avg_sentiment
FROM messages 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Flows más ejecutados
SELECT 
  flow_id,
  COUNT(*) as executions
FROM flow_executions
GROUP BY flow_id
ORDER BY executions DESC;
```

---

## 🐛 Troubleshooting

### Flow no se ejecuta

**1. Verificar que está ACTIVE:**
```http
GET /api/flows/:id

# Response:
{
  "id": "...",
  "status": "ACTIVE"  # Debe ser ACTIVE
}
```

**2. Verificar trigger correcto:**
```json
{
  "trigger": "NEW_MESSAGE"  # Debe coincidir con el evento
}
```

**3. Ver logs:**
```
Dashboard → Logs
Buscar: "Starting flow execution"
```

---

### IA no responde (usa fallback)

**Causa:** No hay `OPENAI_API_KEY`

**Solución:**
1. Agregar variable en Render
2. Redesplegar
3. Verificar en logs: "OpenAI API key not found"

---

### Nodo de condición no funciona

**Verificar:**
1. El campo existe en `variables`
2. El operador es correcto
3. Los edges tienen `sourceHandle` correcto:

```json
{
  "source": "condition-1",
  "target": "action-yes",
  "sourceHandle": "true"  # Para condición verdadera
}
{
  "source": "condition-1",
  "target": "action-no",
  "sourceHandle": "false"  # Para condición falsa
}
```

---

## 🚀 Próximos Pasos

### Mejoras Pendientes

1. **Editor Visual de Flows** (Frontend)
   - Drag & drop con React Flow
   - Configuración visual de nodos
   - Pruebas en tiempo real

2. **Analytics de IA**
   - Dashboard de sentimientos
   - Gráficos de lead scoring
   - Conversiones por flow

3. **Más Acciones**
   - Integración con CRMs externos
   - Webhooks personalizados
   - Envío de emails

4. **Machine Learning**
   - Entrenar modelo con conversaciones propias
   - Predicción de churn
   - Recomendaciones de productos

---

## 📚 Recursos

**Documentación:**
- OpenAI API: https://platform.openai.com/docs
- React Flow: https://reactflow.dev
- Baileys (WhatsApp): https://github.com/WhiskeySockets/Baileys

**Código:**
- Backend AI: `apps/backend/src/ai/`
- Backend Flows: `apps/backend/src/flows/`
- WhatsApp Integration: `apps/backend/src/whatsapp/whatsapp.service.ts`

---

**Última actualización:** 10 de diciembre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Funcional en producción

**Implementado:**
- ✅ Módulo de IA completo
- ✅ Motor de Flows funcional
- ✅ Integración con WhatsApp
- ✅ API REST completa
- ⏳ Editor visual (pendiente)

---

¡Tu CRM ahora tiene súper poderes de automatización e inteligencia artificial! 🚀🤖
