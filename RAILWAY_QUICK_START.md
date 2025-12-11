# 🚀 Quick Start - Railway Production (30 minutos)

Esta es la guía más rápida para deployar OpenTalkWisp en Railway.

---

## ⏱️ Timeline

- **5 min:** Crear servicios en Railway
- **3 min:** Configurar variables de entorno
- **2 min:** Configurar volumen persistente
- **10 min:** Build y deploy
- **5 min:** Actualizar frontend
- **5 min:** Verificación y pruebas

**Total: ~30 minutos**

---

## 📋 Pre-requisitos

- [ ] Cuenta en Railway (https://railway.app)
- [ ] Repositorio en GitHub con el código
- [ ] Cuenta en Vercel (para frontend)

---

## 🎯 Paso a Paso Rápido

### 1️⃣ Crear Proyecto en Railway (5 min)

1. Ve a https://railway.app/new
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu repositorio

### 2️⃣ Agregar Servicios (3 min)

Dentro del proyecto, agrega:

**PostgreSQL:**
- Click "+ New" → "Database" → "PostgreSQL"
- Déjalo con configuración por defecto

**Redis:**
- Click "+ New" → "Database" → "Redis"
- Déjalo con configuración por defecto

### 3️⃣ Configurar Variables de Entorno (3 min)

En el servicio del **Backend**, ve a **Variables** y agrega:

**Copia y pega esto:**
```env
RAILWAY_ENVIRONMENT=production
NODE_ENV=production
PORT=3000
JWT_SECRET=cambiar-por-secreto-seguro-minimo-32-caracteres
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
API_PREFIX=/api
FRONTEND_URL=https://tu-frontend.vercel.app
CORS_ORIGIN=https://tu-frontend.vercel.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
```

**⚠️ Importante:**
- Reemplaza `FRONTEND_URL` y `CORS_ORIGIN` con tu URL de Vercel
- Genera un `JWT_SECRET` seguro (min 32 caracteres)

### 4️⃣ Configurar Volumen Persistente (2 min)

En el servicio del **Backend**:
1. Ve a **Settings** → **Volumes**
2. Click **"+ New Volume"**
3. Configura:
   - **Mount Path:** `/app/wa-sessions`
   - **Name:** `whatsapp-sessions`
4. Click **"Add"**

### 5️⃣ Deploy (10 min - automático)

Railway detectará automáticamente `nixpacks.toml` y hará el build.

**Monitorea el progreso:**
- Ve a **Deployments**
- Click en el deployment activo
- Ve los logs en tiempo real

**Busca en los logs:**
```
✅ Migraciones completadas
✅ Created auth directory at: /app/wa-sessions
🚀 Application listening on port 3000
```

### 6️⃣ Obtener URL del Backend (1 min)

1. Ve a **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copia la URL (ejemplo: `https://opentalk-wisp-backend-production.up.railway.app`)

### 7️⃣ Actualizar Frontend en Vercel (5 min)

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Actualiza o agrega:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://tu-backend.up.railway.app
   ```
4. **Deployments** → Click "..." → **"Redeploy"**

### 8️⃣ Verificar (5 min)

**Opción A: Script Automático**
```bash
chmod +x verify-railway.sh
./verify-railway.sh
```

**Opción B: Manual**
```bash
# Health Check
curl https://tu-backend.up.railway.app/api/health

# Debe retornar:
# {"status":"ok","database":"connected","redis":"connected"}
```

---

## ✅ Checklist Rápido

- [ ] PostgreSQL creado
- [ ] Redis creado
- [ ] Backend deployeado
- [ ] Variables de entorno configuradas
- [ ] Volumen `/app/wa-sessions` creado
- [ ] Domain generado
- [ ] Frontend actualizado con nueva URL
- [ ] Health endpoint responde OK

---

## 🎉 ¡Listo!

Tu backend está corriendo en Railway con:
- ✅ Base de datos PostgreSQL
- ✅ Redis para queues y cache
- ✅ Sesiones de WhatsApp persistentes
- ✅ Auto-deploy en cada push

**Prueba conectar WhatsApp:**
1. Abre el frontend
2. Ve a Configuración → WhatsApp
3. Genera QR Code
4. Escanea con tu teléfono
5. ✅ La sesión persistirá incluso después de reinicios

---

## 🐛 ¿Problemas?

**Build falla:**
- Verifica que `DATABASE_URL` esté configurada
- Revisa logs en Railway Dashboard

**WhatsApp se desconecta:**
- Verifica que `RAILWAY_ENVIRONMENT=production`
- Verifica que el volumen esté en `/app/wa-sessions`

**CORS error:**
- Verifica `FRONTEND_URL` en variables
- Redeploy después de cambiar variables

**Más detalles:** Ver [RAILWAY_MIGRATION_COMPLETE.md](RAILWAY_MIGRATION_COMPLETE.md)

---

## 💰 Costos Estimados

- PostgreSQL: ~$5/mes
- Redis: ~$5/mes
- Backend (Hobby Plan): ~$5/mes
- **Total: ~$15/mes** (mucho más barato que Render + servicios)

---

## 🚀 Próximos Pasos

1. Configura monitoreo (opcional)
2. Agrega dominio custom (opcional)
3. Configura OpenAI API para funciones de IA
4. Configura AWS S3 para medios (opcional)

**¡Tu CRM ya está en producción! 🎊**
