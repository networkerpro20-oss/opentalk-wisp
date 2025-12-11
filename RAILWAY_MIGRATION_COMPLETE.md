# 🚂 Migración Completa de Render a Railway

## 📊 Estado de la Migración

**Fecha:** 11 de diciembre de 2025  
**Razón:** Conflictos al conectar dispositivos de WhatsApp en Render (almacenamiento efímero)  
**Solución:** Railway con volumen persistente

---

## ✅ Lo que ya está hecho

### 1. Configuración del Código
- ✅ [whatsapp.service.ts](apps/backend/src/whatsapp/whatsapp.service.ts) detecta automáticamente Railway mediante `RAILWAY_ENVIRONMENT`
- ✅ Directorio de sesiones WhatsApp configurado: `/app/wa-sessions` (Railway) vs `/tmp/wa-auth` (Render)
- ✅ Archivo `railway.json` con configuración de deployment
- ✅ Archivo `nixpacks.toml` optimizado para Railway
- ✅ Scripts de build y start configurados en `package.json`

### 2. Archivos de Configuración Creados
- ✅ `.env.railway.example` - Template de variables de entorno
- ✅ `railway.json` - Configuración de Railway
- ✅ `nixpacks.toml` - Configuración de build
- ✅ `verify-railway.sh` - Script de verificación

---

## 🔧 Pasos Pendientes en Railway Dashboard

### PASO 1: Crear los Servicios en Railway

1. **Ve a Railway Dashboard**: https://railway.app/dashboard

2. **Crea un nuevo proyecto** o selecciona el existente

3. **Agrega PostgreSQL:**
   - Click en "+ New"
   - Selecciona "Database" → "PostgreSQL"
   - Nombre sugerido: `opentalk-wisp-db`
   - Railway generará automáticamente `DATABASE_URL`

4. **Agrega Redis:**
   - Click en "+ New"
   - Selecciona "Database" → "Redis"
   - Nombre sugerido: `opentalk-wisp-redis`
   - Railway generará automáticamente `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`

5. **Agrega el Backend:**
   - Click en "+ New"
   - Selecciona "GitHub Repo"
   - Conecta tu repositorio: `opentalk-wisp`
   - Root Directory: `/` (raíz del monorepo)
   - Nombre sugerido: `opentalk-wisp-backend`

---

### PASO 2: Configurar Variables de Entorno

En **opentalk-wisp-backend** → **Variables**, agrega:

#### Variables Auto-Generadas (Railway las crea automáticamente):
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
```

#### Variables que DEBES configurar manualmente:

```bash
# Identificador de Railway (IMPORTANTE para volumen persistente)
RAILWAY_ENVIRONMENT=production

# Node Environment
NODE_ENV=production

# Puerto (Railway lo asigna automáticamente, pero podemos definir el default)
PORT=3000

# JWT Configuration (⚠️ CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=genera-un-secreto-super-seguro-aqui-min-32-caracteres
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API Configuration
API_PREFIX=/api

# CORS & Frontend (reemplaza con tu URL de Vercel)
FRONTEND_URL=https://tu-frontend.vercel.app
CORS_ORIGIN=https://tu-frontend.vercel.app
```

#### Variables Opcionales (IA, Email, Storage):

```bash
# OpenAI (para funciones de IA)
OPENAI_API_KEY=sk-tu-api-key-aqui
OPENAI_MODEL=gpt-4-turbo-preview

# Email (SendGrid)
SENDGRID_API_KEY=SG.tu-api-key
SENDGRID_FROM_EMAIL=noreply@tudominio.com
SENDGRID_FROM_NAME=OpenTalkWisp

# AWS S3 (para medios)
AWS_REGION=us-east-1
AWS_S3_BUCKET=opentalk-wisp-media
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_S3_CDN_URL=https://cdn.tudominio.com
```

---

### PASO 3: ⚡ CRÍTICO - Configurar Volumen Persistente

**Este paso es OBLIGATORIO para que WhatsApp funcione correctamente.**

1. Ve a **opentalk-wisp-backend** → **Settings** → **Volumes**

2. Click en **"+ New Volume"**

3. Configura:
   ```
   Mount Path: /app/wa-sessions
   Name: whatsapp-sessions
   Size: 1 GB (es suficiente para sesiones)
   ```

4. Click en **"Add"**

5. **Redeploy** el servicio para que el volumen se monte

**¿Por qué es importante?**
- Sin volumen persistente, las sesiones de WhatsApp se pierden al reiniciar
- Railway detecta automáticamente `RAILWAY_ENVIRONMENT` y usa `/app/wa-sessions`
- Este directorio estará disponible incluso después de reinicios

---

### PASO 4: Configurar Build & Deploy Settings

En **opentalk-wisp-backend** → **Settings**:

#### Build Settings:
```bash
Build Command: (Automático con nixpacks.toml)
Start Command: (Automático con nixpacks.toml)
```

Railway usará automáticamente los comandos definidos en `nixpacks.toml`:
- **Build:** `cd apps/backend && pnpm prisma generate && pnpm build`
- **Start:** `cd apps/backend && pnpm prisma migrate deploy && node dist/main.js`

#### Deploy Settings:
- ✅ **Auto Deploy:** Activado (deploy automático en push a main/master)
- ✅ **Health Check Path:** `/api/health`
- ✅ **Health Check Timeout:** 300 segundos
- ✅ **Restart Policy:** ON_FAILURE (max 10 intentos)

---

### PASO 5: Generar Domain y Actualizar Frontend

1. **En Railway**, ve a **opentalk-wisp-backend** → **Settings** → **Networking**

2. Click en **"Generate Domain"**

3. Railway te dará una URL como:
   ```
   https://opentalk-wisp-backend-production.up.railway.app
   ```

4. **Copia esta URL**

5. **Ve a Vercel** (tu frontend):
   - Abre tu proyecto
   - Ve a **Settings** → **Environment Variables**
   - Actualiza o agrega:
     ```
     NEXT_PUBLIC_API_URL=https://opentalk-wisp-backend-production.up.railway.app
     NEXT_PUBLIC_WS_URL=wss://opentalk-wisp-backend-production.up.railway.app
     ```

6. **Redeploy** el frontend en Vercel

---

## 🔍 Verificación del Deployment

### Opción 1: Script Automático

```bash
chmod +x verify-railway.sh
./verify-railway.sh
```

El script te pedirá la URL de Railway y verificará:
- ✅ Servidor respondiendo
- ✅ Health endpoint
- ✅ Conexión a PostgreSQL
- ✅ Conexión a Redis
- ✅ Configuración CORS

### Opción 2: Verificación Manual

#### 1. Health Check
```bash
curl https://tu-backend.up.railway.app/api/health
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

#### 2. Verificar Logs
En Railway Dashboard → **Deployments** → Click en el deployment actual

Busca en los logs:
```
✅ Created auth directory at: /app/wa-sessions
📁 Storage: Railway Persistent Volume
🚀 Application listening on port 3000
```

#### 3. Verificar Volumen
```bash
# En los logs deberías ver:
✅ Using existing auth directory: /app/wa-sessions
📁 Storage: Railway Persistent Volume
```

---

## 📋 Checklist Completo de Migración

### Infraestructura Railway
- [ ] PostgreSQL creado
- [ ] Redis creado
- [ ] Backend conectado a GitHub
- [ ] Volumen persistente `/app/wa-sessions` creado y montado
- [ ] Domain generado

### Variables de Entorno
- [ ] `RAILWAY_ENVIRONMENT=production`
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (auto-generada)
- [ ] `REDIS_URL` (auto-generada)
- [ ] `JWT_SECRET` (generado y seguro)
- [ ] `FRONTEND_URL` (URL de Vercel)
- [ ] `CORS_ORIGIN` (URL de Vercel)

### Deployment
- [ ] Build exitoso (sin errores)
- [ ] Migraciones de Prisma ejecutadas
- [ ] Health endpoint responde 200 OK
- [ ] Logs muestran "Railway Persistent Volume"

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` actualizada
- [ ] `NEXT_PUBLIC_WS_URL` actualizada
- [ ] Frontend redeployeado
- [ ] Frontend conecta correctamente al backend

### WhatsApp
- [ ] Sesiones se guardan en `/app/wa-sessions`
- [ ] QR Code se genera correctamente
- [ ] Conexión persiste después de redeploy
- [ ] Sin errores de "ENOENT" en logs

---

## 🔄 Diferencias: Render vs Railway

| Aspecto | Render | Railway |
|---------|--------|---------|
| **Almacenamiento** | Efímero (`/tmp`) | Persistente (Volumes) |
| **WhatsApp Sessions** | ❌ Se pierden al reiniciar | ✅ Persisten |
| **Auto-Deploy** | ✅ Git push | ✅ Git push |
| **Migraciones DB** | Manual/Script | Automático en start |
| **Health Checks** | ✅ Configurable | ✅ Configurable |
| **Logs** | ✅ Real-time | ✅ Real-time |
| **Pricing** | $7/mes | $5/mes + uso |
| **Volumes** | ❌ No soportado | ✅ Nativo |

---

## 🚀 Comandos Útiles

### Ver logs en Railway CLI (opcional)
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Ver logs
railway logs

# SSH al contenedor (para debug)
railway shell
```

### Verificar sesiones de WhatsApp
```bash
# Si usas Railway CLI
railway shell

# Dentro del contenedor
ls -la /app/wa-sessions/
```

---

## 🐛 Troubleshooting

### Build falla con error de Prisma
```bash
# Verifica que DATABASE_URL esté configurada
# Verifica logs: Railway → Deployments → Click en deployment
```

**Solución:** Asegúrate que PostgreSQL esté creado primero

### WhatsApp se desconecta después de redeploy
```bash
# Verifica que el volumen esté montado
railway shell
ls -la /app/wa-sessions/
```

**Solución:** 
1. Verifica que `RAILWAY_ENVIRONMENT=production`
2. Verifica que el volumen esté en `/app/wa-sessions`
3. Redeploy después de configurar el volumen

### CORS bloqueado
```bash
# Verifica logs para ver si el origin está bloqueado
⚠️ Origin bloqueado: https://...
```

**Solución:**
1. Verifica `FRONTEND_URL` en variables de entorno
2. Verifica `CORS_ORIGIN` en variables de entorno
3. Redeploy

### Base de datos no conecta
```bash
# Health endpoint retorna error de DB
```

**Solución:**
1. Verifica que PostgreSQL esté running en Railway
2. Verifica que `DATABASE_URL` esté configurada
3. Verifica logs de PostgreSQL en Railway

---

## 📞 Próximos Pasos

1. ✅ **Completa el checklist** de arriba
2. ✅ **Ejecuta `./verify-railway.sh`** para verificar todo
3. ✅ **Prueba conectar WhatsApp** desde el frontend
4. ✅ **Monitorea los logs** durante las primeras horas
5. ✅ **Documenta la URL** del backend para tu equipo

---

## 📚 Recursos

- 🔗 [Railway Documentation](https://docs.railway.app)
- 🔗 [Nixpacks Documentation](https://nixpacks.com/docs)
- 🔗 [Railway Volumes Guide](https://docs.railway.app/reference/volumes)
- 🔗 [Baileys WhatsApp Documentation](https://github.com/WhiskeySockets/Baileys)

---

## 🎯 Ventajas de Railway sobre Render

1. **Volúmenes Persistentes Nativos** ✅
   - Las sesiones de WhatsApp persisten
   - No se pierden datos al reiniciar

2. **Mejor Pricing** 💰
   - $5/mes + uso vs $7/mes fijo
   - Pay-as-you-go más flexible

3. **Deploy más rápido** ⚡
   - Builds más rápidos
   - Mejor caché de dependencias

4. **Mejor Developer Experience** 🎨
   - Dashboard más intuitivo
   - Logs más claros
   - Variables de entorno más fáciles

---

**✅ MIGRACIÓN LISTA PARA EJECUTAR**

¡Sigue los pasos de arriba y tu backend estará funcionando en Railway en menos de 30 minutos!
