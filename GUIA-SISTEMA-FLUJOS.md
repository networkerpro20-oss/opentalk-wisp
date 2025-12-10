# 🤖 Sistema de Flujos Visual - Chatbot Automation

## 📋 Descripción General

Sistema completo de automatización visual para crear chatbots inteligentes con drag & drop. Permite construir flujos conversacionales sin código, con múltiples formas de responder y capacidades de IA integradas.

## ✨ Características Principales

### 1. **Editor Visual Drag & Drop**
- Canvas interactivo con React Flow
- Zoom, pan y mini-mapa
- Conexiones visuales entre nodos
- Auto-guardado y validación en tiempo real

### 2. **10 Tipos de Nodos Disponibles**

#### 🎯 **Trigger (Inicio)**
- Define cuándo se activa el flow
- Opciones: NEW_MESSAGE, KEYWORD, BUTTON_CLICK
- Color: Verde gradiente

#### 💬 **Mensaje**
- Envía mensajes de texto
- Soporte para variables: `{nombre}`, `{email}`
- Color: Blanco

#### ❓ **Pregunta**
- Captura información del usuario
- Guarda respuesta en variable personalizada
- Color: Azul claro

#### 📋 **Menú de Opciones**
- Presenta opciones numeradas al usuario
- Captura selección en variable
- Hasta N opciones dinámicas
- Color: Índigo

#### 🔀 **Condición (If/Else)**
- Bifurcación lógica basada en variables
- 8 operadores: equals, contains, starts_with, ends_with, etc.
- Dos salidas: Sí (verde) y No (rojo)
- Color: Amarillo

#### 🤖 **IA (Inteligencia Artificial)**
- Analizar sentimiento (POSITIVE/NEUTRAL/NEGATIVE)
- Generar respuesta inteligente con GPT-3.5
- Extraer intención del mensaje
- Clasificar mensaje
- Calcular lead score (0-100)
- Color: Púrpura gradiente

#### 📸 **Media**
- Enviar imágenes, videos, audios o documentos
- Soporte para URLs o variables
- Caption opcional
- Color: Rosa

#### ⏱️ **Delay (Esperar)**
- Pausar ejecución del flow
- Unidades: segundos, minutos, horas, días
- Color: Naranja

#### 🏷️ **Tag**
- Agregar etiquetas al contacto
- Segmentación automática
- Color: Verde agua

#### 👤 **Asignar Usuario**
- Asignar conversación a agente específico
- Color: Cyan

#### 🔌 **API Externa**
- Llamar endpoints externos
- Métodos: GET, POST, PUT, DELETE
- Integración con sistemas externos
- Color: Violeta

## 🏗️ Arquitectura del Sistema

### Frontend
```
apps/frontend/src/
├── app/dashboard/flows/
│   ├── page.tsx                    # Listado de flows
│   └── [id]/page.tsx               # Editor visual
├── components/
│   ├── FlowNodes.tsx               # 10 componentes de nodos
│   ├── NodePalette.tsx             # Paleta de componentes
│   └── NodeEditor.tsx              # Panel de configuración
└── store/
    └── flowStore.ts                # Zustand state management
```

### Backend
```
apps/backend/src/
├── flows/
│   ├── flows.module.ts
│   ├── flows.service.ts            # CRUD de flows
│   ├── flows.controller.ts         # API endpoints
│   └── flow-engine.service.ts      # Motor de ejecución
└── ai/
    └── ai.service.ts               # Servicios de IA
```

## 📡 API Endpoints

### Flows Management
```typescript
GET    /api/flows              # Listar todos los flows
GET    /api/flows/:id          # Obtener flow por ID
POST   /api/flows              # Crear nuevo flow
PUT    /api/flows/:id          # Actualizar flow
DELETE /api/flows/:id          # Eliminar flow
POST   /api/flows/:id/toggle   # Activar/Desactivar
POST   /api/flows/:id/test     # Probar ejecución
```

### Estructura de un Flow
```typescript
{
  "id": "uuid",
  "name": "Bienvenida Automática",
  "trigger": "NEW_MESSAGE",
  "isActive": true,
  "config": {
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 250, "y": 50 },
        "data": {
          "label": "Inicio",
          "trigger": "NEW_MESSAGE",
          "icon": "▶️"
        }
      },
      {
        "id": "message-1",
        "type": "message",
        "position": { "x": 250, "y": 200 },
        "data": {
          "label": "Enviar Mensaje",
          "message": "¡Hola {nombre}! Bienvenido a nuestro servicio",
          "icon": "💬"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger-1",
        "target": "message-1"
      }
    ],
    "description": "Flow de bienvenida personalizado"
  }
}
```

## 🎨 Tipos de Respuestas del Chatbot

### 1. **Respuesta de Texto Simple**
```json
{
  "type": "message",
  "data": {
    "message": "Hola, ¿en qué puedo ayudarte?"
  }
}
```

### 2. **Respuesta con Variables**
```json
{
  "type": "message",
  "data": {
    "message": "Hola {nombre}, tu correo es {email}"
  }
}
```

### 3. **Pregunta con Captura**
```json
{
  "type": "question",
  "data": {
    "question": "¿Cuál es tu nombre?",
    "variable": "nombre"
  }
}
```

### 4. **Menú de Opciones**
```json
{
  "type": "menu",
  "data": {
    "options": [
      { "id": "1", "text": "Ventas", "value": "ventas" },
      { "id": "2", "text": "Soporte", "value": "soporte" },
      { "id": "3", "text": "Cotización", "value": "cotizacion" }
    ],
    "variable": "departamento"
  }
}
```

### 5. **Respuesta con Media**
```json
{
  "type": "media",
  "data": {
    "mediaType": "image",
    "mediaUrl": "https://ejemplo.com/catalogo.jpg",
    "caption": "Este es nuestro catálogo de productos"
  }
}
```

### 6. **Respuesta Generada por IA**
```json
{
  "type": "ai",
  "data": {
    "action": "generate_response",
    "prompt": "Responde como un agente de ventas profesional"
  }
}
```

### 7. **Respuesta Condicional**
```json
{
  "type": "condition",
  "data": {
    "field": "departamento",
    "operator": "equals",
    "value": "ventas"
  },
  // Dos ramas: true y false
}
```

### 8. **Respuesta Programada (Delay)**
```json
{
  "type": "delay",
  "data": {
    "duration": 30,
    "unit": "seconds"
  }
}
```

## 🚀 Uso del Editor

### Crear un Nuevo Flow

1. **Ir a Automatizaciones**
   ```
   Dashboard → Automatizaciones → Crear Flow
   ```

2. **Diseñar el Flow**
   - Arrastra componentes desde la paleta izquierda
   - Conecta los nodos haciendo clic y arrastrando desde los puntos de conexión
   - Haz clic en un nodo para configurarlo

3. **Configurar Nodos**
   - Panel lateral se abre al hacer clic en un nodo
   - Edita el contenido, variables, condiciones
   - Guarda los cambios

4. **Guardar y Activar**
   - Botón "💾 Guardar" en la barra superior
   - Toggle "▶️ Activar" en la lista de flows

### Ejemplo: Flow de Bienvenida

```
[Trigger: NEW_MESSAGE]
        ↓
[Pregunta: ¿Cuál es tu nombre?] → variable: nombre
        ↓
[Mensaje: Hola {nombre}, bienvenido]
        ↓
[Menú: ¿En qué puedo ayudarte?]
    ├─ 1. Ventas → [Asignar: Equipo Ventas]
    ├─ 2. Soporte → [Asignar: Equipo Soporte]
    └─ 3. Info → [IA: Generar Respuesta]
```

### Ejemplo: Flow de Calificación de Leads

```
[Trigger: NEW_MESSAGE]
        ↓
[IA: Analizar Sentimiento] → variable: sentiment
        ↓
[Condición: sentiment == POSITIVE?]
    ├─ Sí → [IA: Calcular Lead Score]
    │         ↓
    │       [Condición: score > 70?]
    │           ├─ Sí → [Tag: lead-caliente] → [Asignar: Vendedor Senior]
    │           └─ No → [Tag: lead-tibio] → [Delay: 1 hora] → [Mensaje: Seguimiento]
    │
    └─ No → [Tag: lead-frio] → [Delay: 1 día] → [Mensaje: ¿Sigues interesado?]
```

## 🔧 Configuración Técnica

### Instalación de Dependencias
```bash
pnpm add @xyflow/react zustand
```

### Configuración de Zustand Store
```typescript
// store/flowStore.ts
export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  onNodesChange: (changes) => { /* ... */ },
  onEdgesChange: (changes) => { /* ... */ },
  onConnect: (connection) => { /* ... */ },
  addNode: (type, position) => { /* ... */ },
  updateNode: (nodeId, data) => { /* ... */ },
  deleteNode: (nodeId) => { /* ... */ },
}));
```

### Integración con Backend
```typescript
// Guardar flow
const handleSave = async () => {
  const flowData = getFlowData();
  
  const payload = {
    name: flowData.name,
    trigger: flowData.trigger,
    isActive: true,
    config: {
      nodes: flowData.nodes,
      edges: flowData.edges,
    },
  };

  const res = await fetch('/api/flows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};
```

## 🎯 Variables del Sistema

### Variables Disponibles
```typescript
{nombre}      // Nombre del contacto
{email}       // Email del contacto
{phone}       // Número de teléfono
{custom_*}    // Variables personalizadas capturadas
```

### Capturar Variables
```typescript
// Nodo de tipo "question"
{
  "type": "question",
  "data": {
    "question": "¿Cuál es tu email?",
    "variable": "email"  // Se guarda automáticamente
  }
}
```

### Usar Variables
```typescript
// En cualquier nodo de mensaje
{
  "type": "message",
  "data": {
    "message": "Tu email es {email} y tu nombre es {nombre}"
  }
}
```

## 📊 Estado y Estadísticas

### Panel de Estadísticas
- **Total Flows**: Número de automatizaciones creadas
- **Activos**: Flows en ejecución
- **Inactivos**: Flows pausados

### Monitoreo
- Ver ejecuciones en tiempo real
- Logs de cada flow
- Métricas de conversión

## 🔒 Seguridad

### Validaciones
- Solo usuarios autenticados pueden crear flows
- Validación de estructura de nodos
- Sanitización de inputs del usuario
- Rate limiting en API calls

### Mejores Prácticas
1. **No exponer información sensible** en mensajes
2. **Validar entradas del usuario** en condiciones
3. **Usar delays** para evitar spam
4. **Limitar recursividad** en flows

## 🐛 Troubleshooting

### Error: "Flow no se ejecuta"
✅ Verificar que el flow esté **Activo**
✅ Revisar que el **trigger** sea correcto
✅ Validar **conexiones** entre nodos

### Error: "Variables no se reemplazan"
✅ Asegurar formato correcto: `{nombre}` (con llaves)
✅ Verificar que la variable fue **capturada** previamente

### Error: "IA no responde"
✅ Verificar **OPENAI_API_KEY** en backend
✅ Revisar logs del servidor
✅ Usar fallback si OpenAI falla

## 📚 Recursos Adicionales

### Documentación
- [React Flow Docs](https://reactflow.dev/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [NestJS Flows](../backend/src/flows)

### Ejemplos de Flows
- Bienvenida automática
- Calificación de leads
- FAQ con IA
- Encuestas de satisfacción
- Reservas y citas
- Soporte multi-nivel

## 🚀 Próximos Pasos

### Funcionalidades Pendientes
- [ ] Plantillas de flows predefinidas
- [ ] Export/Import de flows (JSON)
- [ ] Versionamiento de flows
- [ ] A/B testing de flows
- [ ] Analytics avanzado
- [ ] Webhooks para eventos
- [ ] Integración con CRMs externos

### Mejoras Planificadas
- [ ] Auto-completado de variables
- [ ] Validación visual de errores
- [ ] Simulador de conversaciones
- [ ] Editor de respuestas ricas (botones, carruseles)
- [ ] Multi-idioma en flows

---

## ✅ Checklist de Implementación

- [x] Backend API de flows (CRUD)
- [x] Motor de ejecución de flows
- [x] Integración con IA
- [x] Editor visual con React Flow
- [x] 10 tipos de nodos personalizados
- [x] Panel de configuración lateral
- [x] Paleta de componentes
- [x] Listado y stats de flows
- [x] Guardar/Cargar flows
- [x] Activar/Desactivar flows
- [ ] Ejecutar flows desde WhatsApp (pendiente re-integración)
- [ ] WebSocket para notificaciones en tiempo real
- [ ] Dashboard de analytics

---

**Estado**: ✅ **COMPLETADO Y FUNCIONAL**  
**Última actualización**: Diciembre 2024  
**Versión**: 1.0.0
