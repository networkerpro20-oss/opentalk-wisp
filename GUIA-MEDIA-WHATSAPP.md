# 📸 Guía: Enviar y Recibir Media en WhatsApp

## ✨ Funcionalidades Implementadas (commit ab05ff4)

### 📤 Envío de Media

Tu CRM ahora puede enviar:
- 🖼️ **Imágenes** (JPG, PNG, GIF, etc.)
- 🎥 **Videos** (MP4, AVI, MOV, etc.)
- 🎵 **Audios** (MP3, M4A, WAV, etc.)
- 📄 **Documentos** (PDF, DOC, DOCX, XLS, etc.)

### 📥 Recepción de Media

Detecta y guarda automáticamente:
- ✅ Imágenes
- ✅ Videos
- ✅ Audios / Notas de voz
- ✅ Documentos
- ✅ Ubicaciones (coordenadas)
- ✅ Contactos compartidos

---

## 🚀 Cómo Usar (Método 1: API Directa)

### Enviar una Imagen

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/whatsapp/send-media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "instanceId": "tu-instance-id",
    "to": "573001234567",
    "type": "image",
    "mediaUrl": "https://ejemplo.com/imagen.jpg",
    "caption": "Mira esta imagen!"
  }'
```

### Enviar desde Base64

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/whatsapp/send-media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "instanceId": "tu-instance-id",
    "to": "573001234567",
    "type": "image",
    "mediaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "caption": "Foto desde base64"
  }'
```

### Enviar un PDF

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/whatsapp/send-media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "instanceId": "tu-instance-id",
    "to": "573001234567",
    "type": "document",
    "mediaUrl": "https://ejemplo.com/catalogo.pdf",
    "fileName": "Catálogo_2025.pdf",
    "caption": "Aquí está nuestro catálogo"
  }'
```

### Enviar un Video

```bash
curl -X POST https://opentalk-wisp.onrender.com/api/whatsapp/send-media \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "instanceId": "tu-instance-id",
    "to": "573001234567",
    "type": "video",
    "mediaUrl": "https://ejemplo.com/tutorial.mp4",
    "caption": "Tutorial de uso"
  }'
```

---

## 🎨 Método 2: Componente React (Frontend)

### Integrar MediaUpload en tu Chat

```tsx
// apps/frontend/src/app/dashboard/conversations/[id]/page.tsx
import MediaUpload from '@/components/MediaUpload';

export default function ChatPage({ params }) {
  const { data: conversation } = useQuery({
    queryKey: ['conversation', params.id],
    queryFn: () => conversationsAPI.get(params.id),
  });

  return (
    <div>
      {/* Tu chat existente */}
      
      {/* Agregar componente de media */}
      {conversation?.whatsappInstance && (
        <MediaUpload
          instanceId={conversation.whatsappInstance.id}
          recipientPhone={conversation.contact.phone}
          onSuccess={() => {
            // Recargar mensajes
            queryClient.invalidateQueries(['messages']);
          }}
        />
      )}
    </div>
  );
}
```

### Personalizar el Componente

```tsx
<MediaUpload
  instanceId="abc-123"
  recipientPhone="573001234567"
  onSuccess={() => {
    console.log('¡Media enviado!');
    // Tu lógica personalizada
  }}
/>
```

---

## 📊 Estructura de Datos

### DTO de Envío (SendMediaDto)

```typescript
{
  instanceId: string;        // ID de la instancia de WhatsApp
  to: string;                // Número del destinatario (573001234567)
  type: 'image' | 'video' | 'audio' | 'document';
  mediaUrl: string;          // URL o base64 del archivo
  caption?: string;          // Texto opcional (imágenes/videos)
  fileName?: string;         // Nombre del archivo (documentos)
  mimeType?: string;         // Tipo MIME (auto-detectado si no se provee)
}
```

### Tipos de Media Soportados

```typescript
export enum MediaType {
  IMAGE = 'image',      // Imágenes
  VIDEO = 'video',      // Videos
  AUDIO = 'audio',      // Audios
  DOCUMENT = 'document' // Documentos
}
```

---

## 📥 Recepción Automática de Media

Cuando alguien te envía media por WhatsApp:

1. **Se descarga automáticamente**
2. **Se convierte a base64**
3. **Se guarda en la base de datos** con el campo `mediaUrl`
4. **Se clasifica por tipo** (IMAGE, VIDEO, AUDIO, DOCUMENT)

### Ejemplo de Mensaje con Media en BD

```json
{
  "id": "msg-123",
  "content": "Mira esta foto",
  "type": "IMAGE",
  "direction": "INBOUND",
  "mediaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "conversationId": "conv-456",
  "contactId": "contact-789",
  "whatsappInstanceId": "instance-001"
}
```

---

## 🎯 Casos de Uso Prácticos

### 1. Enviar Catálogo de Productos

```typescript
const productos = [
  { nombre: 'Producto 1', imagen: 'https://...', precio: '$100' },
  { nombre: 'Producto 2', imagen: 'https://...', precio: '$200' },
];

for (const producto of productos) {
  await whatsappAPI.sendMedia({
    instanceId,
    to: clientePhone,
    type: 'image',
    mediaUrl: producto.imagen,
    caption: `${producto.nombre}\nPrecio: ${producto.precio}`,
  });
  
  await sleep(2000); // Esperar 2 segundos entre mensajes
}
```

### 2. Enviar Factura Automáticamente

```typescript
// Cuando se completa una venta
async function enviarFactura(ventaId: string) {
  const venta = await getVenta(ventaId);
  const pdfUrl = await generarFacturaPDF(venta);
  
  await whatsappAPI.sendMedia({
    instanceId: venta.whatsappInstanceId,
    to: venta.clientePhone,
    type: 'document',
    mediaUrl: pdfUrl,
    fileName: `Factura_${venta.numero}.pdf`,
    caption: `Gracias por tu compra! Aquí está tu factura.`,
  });
}
```

### 3. Respuesta Automática con Imagen

```typescript
// Cuando detectas una palabra clave
socket.on('message:new', async (message) => {
  if (message.content.toLowerCase().includes('horarios')) {
    await whatsappAPI.sendMedia({
      instanceId: message.whatsappInstanceId,
      to: message.contactPhone,
      type: 'image',
      mediaUrl: 'https://tudominio.com/horarios.jpg',
      caption: 'Estos son nuestros horarios de atención',
    });
  }
});
```

---

## ⚙️ Configuración Avanzada

### Límites de Tamaño

WhatsApp tiene límites en el tamaño de archivos:

- **Imágenes**: Máx 5 MB
- **Videos**: Máx 16 MB
- **Audios**: Máx 16 MB
- **Documentos**: Máx 100 MB

**Recomendación**: Comprimir archivos antes de enviar

### Optimización de Imágenes

```typescript
// Ejemplo: Redimensionar imagen antes de enviar
import sharp from 'sharp';

const buffer = await sharp(imagePath)
  .resize(1024, 1024, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toBuffer();

const base64 = buffer.toString('base64');
const dataUrl = `data:image/jpeg;base64,${base64}`;

await whatsappAPI.sendMedia({
  type: 'image',
  mediaUrl: dataUrl,
  // ...
});
```

---

## 🐛 Troubleshooting

### Error: "File too large"

**Solución**: Comprimir o redimensionar el archivo antes de enviar

### Error: "Unsupported media type"

**Solución**: Verificar que el tipo sea uno de: image, video, audio, document

### Media no se muestra en WhatsApp

**Posibles causas**:
1. El base64 está mal formado
2. El MIME type es incorrecto
3. El archivo está corrupto

**Solución**: Verificar el `mediaUrl` y asegurar que sea válido

### Media entrante no se guarda

**Verificar**:
1. Que Baileys esté conectado
2. Logs del backend (puede haber error al descargar)
3. Espacio disponible en disco

---

## 📊 Monitoreo

### Ver Media Enviados

```sql
-- En tu base de datos
SELECT 
  content,
  type,
  direction,
  LENGTH(mediaUrl) as media_size,
  createdAt
FROM messages
WHERE type IN ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT')
ORDER BY createdAt DESC
LIMIT 10;
```

### Estadísticas de Media

```typescript
// API endpoint para stats
GET /api/messages/stats?mediaOnly=true

// Respuesta:
{
  "total": 450,
  "byType": {
    "IMAGE": 320,
    "VIDEO": 50,
    "AUDIO": 40,
    "DOCUMENT": 40
  },
  "totalSize": "125 MB"
}
```

---

## 🚀 Próximas Mejoras

### Pendiente de Implementar

- [ ] Subir archivos directamente desde el frontend (usar S3/Cloudinary)
- [ ] Compresión automática de imágenes
- [ ] Thumbnails para videos
- [ ] Galería de media en la conversación
- [ ] Búsqueda de mensajes por tipo de media
- [ ] Descarga masiva de media
- [ ] Límites de tamaño configurables

---

## 📝 Resumen

✅ **Implementado:**
- Envío de imágenes, videos, audios y documentos
- Recepción automática de todo tipo de media
- Conversión a base64 para almacenamiento
- Componente React reutilizable
- API REST completa

🎯 **Listo para usar en producción**

**Después del redeploy (5-10 min), podrás:**
1. Enviar imágenes a tus clientes desde el CRM
2. Recibir fotos, videos y documentos automáticamente
3. Todo se guarda en la base de datos
4. Integrar en tus flujos de automatización

---

**Última actualización:** 10 de diciembre de 2025  
**Commit:** ab05ff4  
**Estado:** ✅ Funcional en producción (después del deploy)
