# 🔧 Troubleshooting: QR Code de WhatsApp

## Problema: QR Code no se muestra o redirige a login

### Síntomas
- Al hacer clic en "Conectar WhatsApp", la página redirige a `/login`
- Aparecen errores 404 o 400 en la consola del navegador
- El QR Code no se visualiza correctamente

### Causas Principales

#### 1. Token de autenticación expirado o inválido
**Solución:**
1. Cerrar sesión manualmente
2. Limpiar localStorage del navegador:
   ```javascript
   // En consola del navegador:
   localStorage.clear();
   ```
3. Volver a iniciar sesión

#### 2. Backend devuelve QR en formato incorrecto
**Problema:** Baileys genera el QR como string, no como imagen

**Solución implementada (commit 886fcf8):**
```typescript
// Antes (❌):
qr: "2@xyz123..." // String del QR

// Después (✅):
import * as QRCode from 'qrcode';
const qrDataURL = await QRCode.toDataURL(qr);
qr: "data:image/png;base64,iVBORw0KG..." // Data URL
```

#### 3. CORS bloqueando las peticiones
**Síntomas:** Error de CORS en consola

**Solución:**
Verificar que `FRONTEND_URL` esté configurado en Render:
```bash
# En Render Dashboard → Backend Service → Environment
FRONTEND_URL=https://opentalk-wisp-frontend.vercel.app
```

#### 4. Instancia de WhatsApp no existe o no genera QR
**Solución:**
1. Verificar que la instancia existe:
   ```bash
   # Backend logs en Render
   # Buscar: "QR Code generated for instance..."
   ```

2. Si no hay QR, eliminar y recrear la instancia:
   - Dashboard → WhatsApp → Eliminar instancia
   - Crear nueva instancia
   - Intentar conectar nuevamente

### Cómo Verificar que el Fix Funcionó

#### 1. Verificar en Render que el deploy se completó
```
Dashboard → Backend Service → Events
Buscar: "Deploy succeeded" con commit 886fcf8
```

#### 2. Probar el endpoint directamente
```bash
# Obtener tu token
TOKEN="<tu-token-de-sesion>"

# Probar endpoint (reemplazar INSTANCE_ID)
curl -H "Authorization: Bearer $TOKEN" \
  https://opentalk-wisp.onrender.com/api/whatsapp/instances/INSTANCE_ID/qr
```

**Respuesta esperada:**
```json
{
  "id": "abc123",
  "name": "Mi WhatsApp",
  "status": "QR_CODE",
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "phone": null,
  "connectedAt": null,
  "createdAt": "2025-12-10T...",
  "updatedAt": "2025-12-10T..."
}
```

#### 3. Probar en el frontend
1. Login en: https://opentalk-wisp-frontend.vercel.app
2. Dashboard → WhatsApp
3. Crear nueva instancia (si no existe)
4. Click en "Ver QR"
5. Debería mostrarse el QR Code como imagen

### Logs Útiles para Debug

#### Backend (Render)
```bash
# Dashboard → Backend → Logs
# Buscar:
✅ "QR Code generated for instance xyz"
✅ "WhatsApp instance xyz connected"
❌ "WhatsApp instance not found"
❌ "Cannot create auth directory"
```

#### Frontend (Browser DevTools)
```bash
# Console → Network → Filter: "whatsapp"
# Buscar:
✅ GET /api/whatsapp/instances → 200 OK
✅ GET /api/whatsapp/instances/xyz/qr → 200 OK
❌ GET /api/whatsapp/instances/xyz/qr → 401 Unauthorized
❌ GET /api/whatsapp/instances/xyz/qr → 404 Not Found
```

### Problemas Conocidos

#### 1. QR Code expira cada ~60 segundos
**Comportamiento normal:** WhatsApp genera QR nuevos frecuentemente

**Solución:** El frontend hace auto-refresh cada 5 segundos
```typescript
// apps/frontend/src/app/dashboard/whatsapp/[id]/qr/page.tsx
refetchInterval: 5000, // ✅ Ya implementado
```

#### 2. Filesystem no disponible en entornos serverless
**Problema:** Baileys guarda sesiones en `/wa-auth` (filesystem)

**Plataformas afectadas:**
- ❌ Vercel (serverless, no tiene filesystem persistente)
- ✅ Render (tiene disco persistente)
- ✅ Railway (tiene disco persistente)
- ✅ VPS/Docker (tiene filesystem)

**Solución:** Usar Render o Railway para el backend, no Vercel

#### 3. Render Free Tier se "duerme"
**Problema:** Después de 15 min sin actividad, el servicio se apaga

**Solución:**
1. Usar plan Starter ($7/mes) - recomendado
2. O configurar UptimeRobot para hacer ping cada 5 min (gratis)
   ```
   URL: https://opentalk-wisp.onrender.com/api/health
   Interval: 5 minutes
   ```

### Próximos Pasos si el Problema Persiste

1. **Verificar logs de Render:**
   ```
   Dashboard → Backend Service → Logs → Filtrar por "error"
   ```

2. **Revisar variables de entorno:**
   ```bash
   # Render Dashboard → Backend → Environment
   ✅ DATABASE_URL (debe ser Internal URL)
   ✅ JWT_SECRET (debe tener 32+ caracteres)
   ✅ FRONTEND_URL (debe ser tu URL de Vercel)
   ✅ NODE_ENV=production
   ✅ PORT=10000
   ```

3. **Verificar que la migración de Prisma se ejecutó:**
   ```bash
   # Render Shell
   cd /opt/render/project/src/apps/backend
   pnpm prisma migrate status
   ```

4. **Recrear la base de datos (último recurso):**
   ```bash
   # Render Dashboard → Database → Delete
   # Crear nueva database
   # Redesplegar backend (ejecutará migraciones)
   ```

### Contacto y Soporte

Si el problema persiste después de seguir estos pasos:

1. **Revisar el análisis completo:** `ANALISIS-PRODUCCION-COMPLETO.md`
2. **Revisar la guía de deployment:** `DEPLOY_VERCEL_RENDER.md`
3. **Verificar el código fuente:** 
   - Backend: `apps/backend/src/whatsapp/whatsapp.service.ts`
   - Frontend: `apps/frontend/src/app/dashboard/whatsapp/[id]/qr/page.tsx`

---

**Última actualización:** 10 de diciembre de 2025  
**Commit del fix:** 886fcf8  
**Estado:** ✅ Resuelto (QR Code ahora se genera como Data URL)
