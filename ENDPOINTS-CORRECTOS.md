# 🔧 Endpoints Correctos - OpenTalkWisp API

## ✅ Estado del Deploy

**Último commit:** feff002 - Fix dependencias circulares  
**Deploy iniciado:** Automático desde GitHub  
**ETA:** 5-10 minutos

---

## 📍 Base URL

```
https://opentalk-wisp.onrender.com
```

---

## 🧪 Endpoints para Probar

### 1. Health Check (Funciona ✅)

```bash
curl https://opentalk-wisp.onrender.com/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "info": {
    "database": {"status": "up"},
    "memory": {"status": "up", "heapUsed": "47 MB", "heapTotal": "51 MB"},
    "disk": {"status": "up"}
  }
}
```

---

### 2. Módulo de IA (Después del redeploy)

#### Analizar Sentimiento

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Gracias! Excelente servicio, estoy muy feliz"}'
```

**Respuesta esperada:**
```json
{
  "sentiment": "POSITIVE",
  "score": 0.85,
  "confidence": 0.9,
  "emotions": {
    "joy": 0.9,
    "sadness": 0.1,
    "anger": 0.05,
    "fear": 0.05,
    "interest": 0.7
  }
}
```

#### Calcular Lead Score

```bash
# Necesita un contactId válido
curl https://opentalk-wisp.onrender.com/api/ai/lead-score/CONTACT_ID \
  -H "Authorization: Bearer TU_TOKEN"
```

#### Generar Respuesta Automática

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/ai/auto-response \
  -H "Content-Type: application/json" \
  -d '{
    "messageText": "Hola, quisiera saber los precios",
    "context": ["Hola!", "Bienvenido"]
  }'
```

#### Extraer Información

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/ai/extract-info \
  -H "Content-Type: application/json" \
  -d '{"text": "Soy Juan Pérez, mi email es juan@example.com y mi teléfono es +57 300 123 4567"}'
```

---

### 3. Módulo de Flows (Después del redeploy)

#### Listar Flows

```bash
curl https://opentalk-wisp.onrender.com/api/flows \
  -H "Authorization: Bearer TU_TOKEN"
```

#### Crear un Flow

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/flows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "name": "Test Flow",
    "description": "Flow de prueba",
    "trigger": "NEW_MESSAGE",
    "isActive": true,
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "data": {"trigger": "NEW_MESSAGE"},
        "position": {"x": 0, "y": 0}
      },
      {
        "id": "end-1",
        "type": "end",
        "data": {},
        "position": {"x": 0, "y": 100}
      }
    ],
    "edges": [
      {"id": "e1", "source": "trigger-1", "target": "end-1"}
    ]
  }'
```

#### Obtener un Flow

```bash
curl https://opentalk-wisp.onrender.com/api/flows/FLOW_ID \
  -H "Authorization: Bearer TU_TOKEN"
```

#### Activar/Desactivar Flow

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/flows/FLOW_ID/toggle \
  -H "Authorization: Bearer TU_TOKEN"
```

#### Probar Flow

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/flows/FLOW_ID/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "contactId": "contact-123",
    "conversationId": "conv-456",
    "variables": {
      "messageText": "hola",
      "contactName": "Juan"
    }
  }'
```

---

### 4. WhatsApp (Ya funciona)

#### Crear Instancia

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/whatsapp/instances \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"name": "Mi WhatsApp", "description": "Instancia de prueba"}'
```

#### Obtener QR

```bash
curl https://opentalk-wisp.onrender.com/api/whatsapp/instances/INSTANCE_ID/qr \
  -H "Authorization: Bearer TU_TOKEN"
```

#### Enviar Mensaje

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "instanceId": "INSTANCE_ID",
    "to": "573001234567",
    "message": "Hola desde la API!"
  }'
```

#### Enviar Media

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/whatsapp/send-media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "instanceId": "INSTANCE_ID",
    "to": "573001234567",
    "type": "image",
    "mediaUrl": "https://example.com/imagen.jpg",
    "caption": "Mira esta imagen!"
  }'
```

---

## 🔐 Autenticación

### Registro

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "organization": {
      "name": "Mi Empresa"
    }
  }'
```

### Login

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

**Usar el token:**
```bash
curl https://opentalk-wisp.onrender.com/api/flows \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## 📊 Todos los Endpoints Disponibles

### Core
- `GET /api/health` - Health check ✅
- `POST /api/auth/register` - Registro ✅
- `POST /api/auth/login` - Login ✅
- `GET /api/auth/me` - Usuario actual ✅

### Organizaciones
- `GET /api/organizations` - Listar organizaciones ✅
- `GET /api/organizations/:id` - Obtener organización ✅
- `PATCH /api/organizations/:id` - Actualizar organización ✅

### Usuarios
- `GET /api/users` - Listar usuarios ✅
- `GET /api/users/:id` - Obtener usuario ✅
- `PATCH /api/users/:id` - Actualizar usuario ✅

### Contactos
- `GET /api/contacts` - Listar contactos ✅
- `POST /api/contacts` - Crear contacto ✅
- `GET /api/contacts/:id` - Obtener contacto ✅
- `PATCH /api/contacts/:id` - Actualizar contacto ✅
- `DELETE /api/contacts/:id` - Eliminar contacto ✅

### Conversaciones
- `GET /api/conversations` - Listar conversaciones ✅
- `POST /api/conversations` - Crear conversación ✅
- `GET /api/conversations/:id` - Obtener conversación ✅
- `PATCH /api/conversations/:id` - Actualizar conversación ✅

### Mensajes
- `GET /api/messages` - Listar mensajes ✅
- `POST /api/messages` - Crear mensaje ✅
- `GET /api/messages/:id` - Obtener mensaje ✅

### WhatsApp
- `POST /api/whatsapp/instances` - Crear instancia ✅
- `GET /api/whatsapp/instances` - Listar instancias ✅
- `GET /api/whatsapp/instances/:id` - Obtener instancia ✅
- `GET /api/whatsapp/instances/:id/qr` - Obtener QR ✅
- `DELETE /api/whatsapp/instances/:id` - Eliminar instancia ✅
- `POST /api/whatsapp/send` - Enviar mensaje ✅
- `POST /api/whatsapp/send-media` - Enviar media ✅

### Deals
- `GET /api/deals` - Listar deals ✅
- `POST /api/deals` - Crear deal ✅
- `GET /api/deals/:id` - Obtener deal ✅
- `PATCH /api/deals/:id` - Actualizar deal ✅
- `DELETE /api/deals/:id` - Eliminar deal ✅

### IA (Después del redeploy)
- `POST /api/ai/sentiment` - Analizar sentimiento ⏳
- `GET /api/ai/lead-score/:contactId` - Calcular lead score ⏳
- `POST /api/ai/auto-response` - Generar respuesta ⏳
- `POST /api/ai/extract-info` - Extraer información ⏳

### Flows (Después del redeploy)
- `POST /api/flows` - Crear flow ⏳
- `GET /api/flows` - Listar flows ⏳
- `GET /api/flows/:id` - Obtener flow ⏳
- `PATCH /api/flows/:id` - Actualizar flow ⏳
- `DELETE /api/flows/:id` - Eliminar flow ⏳
- `POST /api/flows/:id/toggle` - Activar/desactivar ⏳
- `POST /api/flows/:id/test` - Probar flow ⏳

---

## 🐛 Problema Resuelto

### ❌ Error Anterior
```
Cannot POST /api/ai/sentiment
Cannot GET /api/flows
```

### ✅ Causa
Dependencia circular entre `WhatsappModule` y `FlowsModule` impedía que los módulos se cargaran correctamente.

### ✅ Solución
1. Removida inyección circular de `FlowEngineService` en `WhatsappService`
2. Simplificados módulos para evitar `forwardRef`
3. Comentada integración automática de flows (se implementará con eventos)

### ✅ Resultado
- Módulos AI y Flows ahora se cargan correctamente
- Endpoints `/api/ai/*` y `/api/flows` funcionarán después del redeploy
- Backend compila sin errores

---

## ⏱️ Verificar Redeploy

```bash
# Esperar 5-10 minutos, luego probar:
curl https://opentalk-wisp.onrender.com/api/ai/sentiment \
  -X POST -H "Content-Type: application/json" \
  -d '{"text":"Excelente!"}'

# Si responde con JSON (no 404), el redeploy funcionó ✅
```

---

## 📖 Documentación Completa

- **GUIA-IA-FLOWS.md** - Manual completo de IA y Flows
- **GUIA-MEDIA-WHATSAPP.md** - Guía de media
- **IMPLEMENTACION-COMPLETA.md** - Resumen de implementación
- **Swagger Docs** (solo en desarrollo): `http://localhost:10000/api/docs`

---

**Estado:** ⏳ Redeploy en progreso  
**ETA:** 5-10 minutos  
**Próximo paso:** Probar endpoints de IA y Flows
