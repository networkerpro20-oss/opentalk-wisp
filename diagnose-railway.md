# 🔍 Diagnóstico de Fallo en Railway

## Error Actual
```
Healthcheck failed - service unavailable at /api/health
All 14 attempts failed over 5 minutes
```

## ✅ Pasos de Diagnóstico

### 1️⃣ Verificar Logs Completos

**En Railway Dashboard:**
1. Click en `opentalk-wisp-backend`
2. Click en "Deployments"
3. Click en el deployment que falló
4. Lee TODOS los logs, especialmente busca:

**Errores Críticos a Buscar:**
```
❌ "Error: Cannot find module"
❌ "Error connecting to database"
❌ "ECONNREFUSED"
❌ "prisma migrate"
❌ "Missing environment variable"
❌ "Port already in use"
```

**Mensajes Buenos (si aparecen):**
```
✅ "Prisma schema loaded"
✅ "Database connection successful"
✅ "Migrations done, starting server..."
✅ "Nest application successfully started"
✅ "Application is running on: http://[::]:3000"
```

### 2️⃣ Variables de Entorno Requeridas

Ve a: **Backend Service → Variables**

**Verifica que TODAS estas existan:**

#### Referencias (tipo Reference):
- [ ] `DATABASE_URL` → Reference to `Postgres.DATABASE_URL`
- [ ] `REDIS_URL` → Reference to `Redis.REDIS_URL`
- [ ] `REDIS_HOST` → Reference to `Redis.REDIS_HOST`
- [ ] `REDIS_PORT` → Reference to `Redis.REDIS_PORT`

#### Variables Directas:
- [ ] `JWT_SECRET=mekZudPUxXL29YqR5J2DvAIVAgRR15pyf9lK3zwNwhY=`
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `JWT_REFRESH_EXPIRES_IN=30d`
- [ ] `NODE_ENV=production`
- [ ] `RAILWAY_ENVIRONMENT=production`
- [ ] `PORT=3000`
- [ ] `API_PREFIX=/api`
- [ ] `FRONTEND_URL=https://opentalk-wisp-frontend.vercel.app`
- [ ] `CORS_ORIGIN=https://opentalk-wisp-frontend.vercel.app`

### 3️⃣ Healthcheck Path Correcto

Railway está intentando: `/api/health`

**Verifica en Settings → Networking:**
- [ ] Healthcheck Path debe ser: `/api/health/simple`

**IMPORTANTE:** Cambia el healthcheck path de `/api/health` a `/api/health/simple`

El endpoint `/api/health/simple` NO requiere database ni redis, responde inmediatamente.

### 4️⃣ Verificar nixpacks.toml

El archivo debe estar en la raíz del proyecto y contener:

```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'openssl']

[phases.install]
cmds = [
  'corepack enable',
  'corepack prepare pnpm@8.15.0 --activate',
  'pnpm install --frozen-lockfile'
]

[phases.build]
cmds = [
  'cd apps/backend && pnpm prisma generate',
  'cd apps/backend && pnpm build'
]

[start]
cmd = "cd apps/backend && pnpm prisma migrate deploy && node dist/main.js"
```

### 5️⃣ Posibles Problemas Comunes

#### A. Database No Conecta
**Síntoma:** "Can't reach database server"
**Solución:** 
- Verifica que `DATABASE_URL` sea una REFERENCIA no un valor manual
- Debe mostrar: `${{Postgres.DATABASE_URL}}`

#### B. Puerto Incorrecto
**Síntoma:** Service starts pero healthcheck falla
**Solución:**
- Verifica `PORT=3000` en variables
- Railway expone automáticamente el puerto

#### C. Migraciones Fallan
**Síntoma:** "Migration failed" en logs
**Solución:**
```bash
# Desde tu computadora, ejecuta:
railway link
railway run pnpm --filter=backend prisma migrate deploy
```

#### D. Memoria Insuficiente
**Síntoma:** "JavaScript heap out of memory"
**Solución:**
- En Settings → Resources
- Aumenta Memory Limit a 1GB

#### E. Build Timeout
**Síntoma:** Build se detiene sin completar
**Solución:**
- Verifica que `pnpm-lock.yaml` esté en el repo
- Commit y push si falta

## 🔧 Soluciones Rápidas

### Solución 1: Cambiar Healthcheck (MÁS PROBABLE)

1. Backend Service → Settings → Networking
2. Healthcheck Path: `/api/health/simple`
3. Healthcheck Timeout: 30s
4. Guardar y redeploy

### Solución 2: Verificar Variables Críticas

Asegúrate que existan (mínimo):
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=3000
NODE_ENV=production
JWT_SECRET=mekZudPUxXL29YqR5J2DvAIVAgRR15pyf9lK3zwNwhY=
```

### Solución 3: Ver Logs en Tiempo Real

```bash
# Instala CLI si no la tienes
npm i -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Ver logs
railway logs
```

### Solución 4: Test Manual del Healthcheck

Cuando el servicio esté corriendo (aunque el healthcheck falle):

1. Obtén la URL pública del servicio
2. Prueba manualmente:
```bash
curl https://tu-servicio.railway.app/api/health/simple
curl https://tu-servicio.railway.app/api/health
```

## 📊 Checklist de Verificación

- [ ] Todos los logs leídos y entendidos
- [ ] Variables de entorno configuradas (mínimo DATABASE_URL, PORT, JWT_SECRET)
- [ ] Healthcheck path cambiado a `/api/health/simple`
- [ ] PostgreSQL está Online
- [ ] Redis está Online (opcional pero recomendado)
- [ ] Volumen `/app/wa-sessions` conectado
- [ ] nixpacks.toml existe en el repo

## 🆘 Si Nada Funciona

Comparte los logs completos del deployment (últimas 100 líneas) para diagnóstico específico.

Especialmente busca la sección que dice:
```
==> Building
==> Starting
```

Y toda la salida después de eso.
