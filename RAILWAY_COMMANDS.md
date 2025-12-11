# 🎯 Railway - Comandos Exactos a Ejecutar

Esta es una lista de comandos exactos para copiar y pegar en Railway.

---

## 📋 PARTE 1: Variables de Entorno

Ve a Railway Dashboard → tu proyecto → Backend service → **Variables**

Click en **"RAW Editor"** y pega esto (reemplaza los valores que dicen `CAMBIAR`):

```bash
# Railway Environment
RAILWAY_ENVIRONMENT=production
NODE_ENV=production
PORT=3000

# Database & Redis (Railway auto-genera estas)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}

# JWT (CAMBIAR: genera uno con: openssl rand -base64 32)
JWT_SECRET=CAMBIAR-POR-SECRET-GENERADO-CON-OPENSSL
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API
API_PREFIX=/api

# CORS (CAMBIAR con tu URL de Vercel)
FRONTEND_URL=CAMBIAR-POR-TU-URL-DE-VERCEL
CORS_ORIGIN=CAMBIAR-POR-TU-URL-DE-VERCEL
```

---

## 🔐 Generar JWT_SECRET

Ejecuta este comando en tu terminal local:

```bash
openssl rand -base64 32
```

O usa el script helper:

```bash
./railway-setup-helper.sh
```

Copia el resultado y úsalo como `JWT_SECRET` arriba.

---

## 📦 PARTE 2: Configuración del Volumen

En Railway Dashboard → Backend service → Settings → **Volumes**:

1. Click **"+ New Volume"**
2. Llena el formulario:

```
Mount Path: /app/wa-sessions
```

3. Click **"Add"**

---

## 🔨 PARTE 3: Build Settings (Opcional - Nixpacks lo hace automático)

Railway detectará automáticamente el `nixpacks.toml`, pero si necesitas configurarlo manualmente:

En Backend service → Settings → **Build**:

### Build Command:
```bash
pnpm install && cd apps/backend && pnpm prisma generate && pnpm build
```

### Start Command:
```bash
cd apps/backend && pnpm prisma migrate deploy && node dist/main.js
```

### Watch Paths (para rebuilds):
```
apps/backend/src/**
apps/backend/prisma/**
```

---

## 🌐 PARTE 4: Generar Domain

En Backend service → Settings → **Networking**:

1. Click **"Generate Domain"**
2. Railway te dará una URL como:
   ```
   https://opentalk-wisp-backend-production.up.railway.app
   ```
3. **Copia esta URL** - la necesitarás para Vercel

---

## 🎨 PARTE 5: Actualizar Frontend en Vercel

Ve a Vercel Dashboard → tu proyecto frontend → Settings → **Environment Variables**:

### Agrega o actualiza estas variables:

```bash
NEXT_PUBLIC_API_URL=https://TU-URL-DE-RAILWAY.up.railway.app
NEXT_PUBLIC_WS_URL=wss://TU-URL-DE-RAILWAY.up.railway.app
```

**Reemplaza `TU-URL-DE-RAILWAY` con la URL generada en el paso anterior.**

Luego:
1. Ve a **Deployments**
2. Click en los "..." del último deployment
3. Click **"Redeploy"**

---

## ✅ PARTE 6: Verificación

Una vez que el deployment en Railway esté completo:

### Opción A: Script automático
```bash
./verify-railway.sh
```

### Opción B: Manual con curl
```bash
# Reemplaza con tu URL de Railway
curl https://TU-URL-DE-RAILWAY.up.railway.app/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T...",
  "database": "connected",
  "redis": "connected"
}
```

---

## 🔍 PARTE 7: Verificar Logs

En Railway Dashboard → Backend service → **Deployments** → Click en el deployment activo

### Busca estas líneas en los logs:

```
✅ Created auth directory at: /app/wa-sessions
✅ Using existing auth directory: /app/wa-sessions
📁 Storage: Railway Persistent Volume
🔧 CORS permitidos: [...]
🌐 FRONTEND_URL configurada: https://...
🚀 Application listening on port 3000
```

Si ves estas líneas, ¡todo está funcionando correctamente!

---

## 🧪 PARTE 8: Probar WhatsApp

1. Abre tu frontend en el navegador
2. Inicia sesión
3. Ve a **Configuración** → **WhatsApp**
4. Click en **"Conectar WhatsApp"**
5. Debería aparecer un QR Code
6. Escanea con WhatsApp en tu teléfono
7. ✅ La conexión debería establecerse

### Para verificar persistencia:
1. En Railway, haz un **Restart** del servicio
2. Espera a que reinicie
3. Verifica que WhatsApp siga conectado (no pida QR nuevamente)

---

## 🐛 Troubleshooting

### Si el build falla:

```bash
# Verifica en Railway → Deployments → Logs que DATABASE_URL esté configurada
# Busca líneas como:
Error: Environment variable not found: DATABASE_URL
```

**Solución:** Ve a Variables y asegúrate que `DATABASE_URL=${{Postgres.DATABASE_URL}}` esté configurada.

### Si WhatsApp no persiste:

```bash
# Verifica en los logs:
📁 Storage: Railway Persistent Volume
```

**Solución:** 
1. Verifica que `RAILWAY_ENVIRONMENT=production`
2. Verifica que el volumen esté montado en `/app/wa-sessions`
3. Redeploy

### Si hay error de CORS:

```bash
# En los logs verás:
⚠️ Origin bloqueado: https://...
```

**Solución:**
1. Actualiza `FRONTEND_URL` y `CORS_ORIGIN` en Variables
2. Redeploy

---

## 📊 Checklist Final

- [ ] PostgreSQL creado en Railway
- [ ] Redis creado en Railway
- [ ] Variables de entorno pegadas (con valores correctos)
- [ ] JWT_SECRET generado y configurado
- [ ] FRONTEND_URL y CORS_ORIGIN actualizados
- [ ] Volumen `/app/wa-sessions` creado
- [ ] Build completado exitosamente
- [ ] Domain generado
- [ ] Vercel actualizado con nueva URL
- [ ] Health endpoint responde OK
- [ ] Logs muestran "Railway Persistent Volume"
- [ ] WhatsApp se conecta correctamente
- [ ] WhatsApp persiste después de restart

---

## 🎉 ¡Listo!

Si completaste todos los checkboxes, tu migración está completa.

**Siguiente paso:** Monitorea los logs durante las próximas horas para asegurarte que todo funciona correctamente.

---

## 💡 Comandos Útiles

```bash
# Ver logs en tiempo real (requiere Railway CLI)
railway logs

# Restart manual
railway restart

# SSH al contenedor
railway shell

# Verificar archivos de sesión
railway shell
ls -la /app/wa-sessions/
```

---

**¿Necesitas ayuda?** Revisa [RAILWAY_MIGRATION_COMPLETE.md](RAILWAY_MIGRATION_COMPLETE.md) para más detalles.
