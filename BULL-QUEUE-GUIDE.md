# 🚀 Sistema de Colas con Bull Queue

## 📋 Descripción

OpenTalk-WISP ahora utiliza **Bull Queue** para procesamiento asíncrono de mensajes, mejorando significativamente la confiabilidad y rendimiento del sistema.

## 🎯 Ventajas Implementadas

### 1. **Procesamiento Asíncrono**
- ✅ Webhooks responden en < 10ms
- ✅ No más timeouts en operaciones largas
- ✅ Procesamiento en background

### 2. **Confiabilidad**
- ✅ Retry automático con backoff exponencial
- ✅ Persistencia en Redis (no se pierden mensajes)
- ✅ Recuperación automática tras caídas

### 3. **Rate Limiting**
- ✅ Control de concurrencia
- ✅ Respeto de límites de WhatsApp API
- ✅ Priorización de mensajes

### 4. **Monitoreo**
- ✅ Dashboard visual (Bull Board)
- ✅ Métricas en tiempo real
- ✅ Logs estructurados

---

## 📦 Colas Implementadas

### 1. **whatsapp-messages**
Procesamiento de mensajes de WhatsApp

**Jobs:**
- `process-incoming` - Mensajes entrantes (concurrencia: 5)
- `send-outgoing` - Mensajes salientes (concurrencia: 3)
- `send-template` - Mensajes template (concurrencia: 2)

**Ejemplo de uso:**
```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

constructor(
  @InjectQueue('whatsapp-messages') private whatsappQueue: Queue,
) {}

// Procesar mensaje entrante
await this.whatsappQueue.add('process-incoming', {
  from: '+1234567890',
  message: messageData,
  timestamp: Date.now(),
  organizationId: 1,
});

// Enviar mensaje saliente
await this.whatsappQueue.add('send-outgoing', {
  to: '+1234567890',
  message: 'Hola, ¿cómo estás?',
  organizationId: 1,
}, {
  priority: 1, // Alta prioridad
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
});
```

---

### 2. **media-processing**
Procesamiento de archivos multimedia

**Jobs:**
- `process-media` - Procesar media de WhatsApp (concurrencia: 2)
- `compress-video` - Comprimir videos (concurrencia: 1)
- `generate-thumbnail` - Generar miniaturas (concurrencia: 3)

**Ejemplo de uso:**
```typescript
// Procesar media
await this.mediaQueue.add('process-media', {
  messageId: 123,
  message: messageWithMedia,
  organizationId: 1,
}, {
  priority: 5,
});

// Comprimir video
await this.mediaQueue.add('compress-video', {
  messageId: 123,
  videoUrl: 'https://...',
  originalSize: 50000000, // 50MB
}, {
  attempts: 3,
  timeout: 300000, // 5 minutos
});
```

---

### 3. **flow-execution**
Ejecución de flujos de automatización

**Jobs:**
- `check-triggers` - Verificar triggers de flows (concurrencia: 5)
- `execute-flow` - Ejecutar flow completo (concurrencia: 3)

**Ejemplo de uso:**
```typescript
// Verificar triggers
await this.flowQueue.add('check-triggers', {
  messageId: 123,
  from: '+1234567890',
  content: 'hola',
  organizationId: 1,
}, {
  priority: 3,
});

// Ejecutar flow específico
await this.flowQueue.add('execute-flow', {
  flowId: 5,
  conversationId: 100,
  messageId: 123,
  organizationId: 1,
  context: {
    messageContent: 'hola',
    from: '+1234567890',
  },
}, {
  priority: 2,
});
```

---

### 4. **ai-processing**
Procesamiento con Inteligencia Artificial

**Jobs:**
- `generate-response` - Generar respuesta IA (concurrencia: 2)
- `sentiment-analysis` - Análisis de sentimiento (concurrencia: 5)
- `lead-scoring` - Puntuación de leads (concurrencia: 3)
- `extract-info` - Extracción de información (concurrencia: 4)

**Ejemplo de uso:**
```typescript
// Generar respuesta IA
await this.aiQueue.add('generate-response', {
  conversationId: 100,
  prompt: 'Responde de manera amigable',
  messageContent: '¿Cuáles son sus precios?',
  organizationId: 1,
}, {
  priority: 4,
  timeout: 30000, // 30 segundos
});

// Análisis de sentimiento
await this.aiQueue.add('sentiment-analysis', {
  messageId: 123,
  content: 'Estoy muy molesto con el servicio',
  organizationId: 1,
});
```

---

## 🎛️ Configuración

### Variables de Entorno

```bash
# Redis (requerido para Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Opcional: configurar timeouts
QUEUE_JOB_TIMEOUT=30000
QUEUE_ATTEMPTS=3
```

### Producción (Render)

En Render, agregar las siguientes variables de entorno:

```
REDIS_HOST=<redis-host-from-render>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
```

---

## 📊 Dashboard de Monitoreo

Acceder al dashboard de Bull Board en:

```
http://localhost:3000/admin/queues
```

**Funcionalidades:**
- Ver jobs pendientes, activos, completados, fallidos
- Reintentar jobs fallidos manualmente
- Ver detalles de cada job (payload, logs, stack trace)
- Gráficas de rendimiento en tiempo real
- Pausar/reanudar colas

---

## 📈 Métricas API

Obtener estadísticas de las colas:

```bash
curl http://localhost:3000/admin/queues/stats
```

**Respuesta:**
```json
{
  "whatsapp": {
    "waiting": 5,
    "active": 3,
    "completed": 1250,
    "failed": 10,
    "delayed": 0,
    "total": 1268
  },
  "media": {
    "waiting": 2,
    "active": 1,
    "completed": 450,
    "failed": 3,
    "delayed": 0,
    "total": 456
  },
  "flows": {
    "waiting": 8,
    "active": 2,
    "completed": 890,
    "failed": 5,
    "delayed": 1,
    "total": 906
  },
  "ai": {
    "waiting": 3,
    "active": 1,
    "completed": 320,
    "failed": 8,
    "delayed": 0,
    "total": 332
  },
  "timestamp": "2025-12-10T20:30:00.000Z"
}
```

---

## 🔄 Flujo de Procesamiento

### Mensaje Entrante de WhatsApp

```
Webhook recibe mensaje
       ↓
Agregar a cola "whatsapp-messages" (< 10ms)
       ↓
Responder 200 OK a WhatsApp
       ↓
[Background Processing]
       ↓
WhatsappQueueProcessor.process-incoming
       ↓
1. Guardar mensaje en BD
2. Si tiene media → agregar a "media-processing"
3. Agregar a "flow-execution" para verificar triggers
       ↓
FlowQueueProcessor.check-triggers
       ↓
1. Buscar flows activos
2. Verificar condiciones
3. Si match → ejecutar flow
       ↓
FlowQueueProcessor.execute-flow
       ↓
1. Ejecutar nodos del flow
2. Procesar acciones (enviar mensaje, agregar tag, etc.)
3. Si hay acción de IA → agregar a "ai-processing"
       ↓
AiQueueProcessor.generate-response
       ↓
1. Generar respuesta con OpenAI
2. Agregar respuesta a "whatsapp-messages" para envío
       ↓
WhatsappQueueProcessor.send-outgoing
       ↓
1. Enviar mensaje vía WhatsApp API
2. Actualizar estado en BD
```

---

## 🛠️ Troubleshooting

### Jobs Fallando Constantemente

1. Ver logs en Bull Board: `http://localhost:3000/admin/queues`
2. Revisar stack trace del error
3. Verificar conexión a Redis
4. Verificar límites de concurrencia

### Cola Atascada

```typescript
// Limpiar jobs completados antiguos
await queue.clean(3600000, 'completed'); // Más de 1 hora

// Limpiar jobs fallidos
await queue.clean(86400000, 'failed'); // Más de 24 horas

// Pausar cola temporalmente
await queue.pause();

// Reanudar cola
await queue.resume();
```

### Redis Desconectado

- Bull Queue reintenta automáticamente la conexión
- Los jobs se guardan en memoria hasta que Redis esté disponible
- Configurar `maxRetriesPerRequest: null` en configuración de Redis

---

## 🚀 Próximas Mejoras

### Planificadas

- [ ] Jobs programados (Cron)
- [ ] Prioridades dinámicas basadas en VIP status
- [ ] Métricas avanzadas con Prometheus
- [ ] Circuit breaker para APIs externas
- [ ] Dead letter queue para jobs irrecuperables

### Ejemplo: Job Programado

```typescript
// Enviar reporte diario
await this.whatsappQueue.add(
  'send-daily-report',
  { organizationId: 1 },
  {
    repeat: {
      cron: '0 9 * * *', // Todos los días a las 9am
      tz: 'America/Mexico_City',
    },
  },
);

// Enviar mensaje en 1 hora
await this.whatsappQueue.add(
  'send-outgoing',
  { to: '+1234567890', message: 'Recordatorio' },
  {
    delay: 3600000, // 1 hora en ms
  },
);
```

---

## 📚 Referencias

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [@nestjs/bull](https://docs.nestjs.com/techniques/queues)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Redis Documentation](https://redis.io/documentation)

---

## 🎉 Resultado

Con Bull Queue implementado, OpenTalk-WISP ahora es:

- ✅ **Más confiable** - No se pierden mensajes
- ✅ **Más rápido** - Respuestas instantáneas
- ✅ **Más escalable** - Procesa miles de mensajes
- ✅ **Más observable** - Dashboard y métricas
- ✅ **Más resiliente** - Retry automático y recuperación
