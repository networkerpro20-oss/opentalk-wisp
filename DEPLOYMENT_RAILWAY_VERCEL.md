# 🚀 Guía de Deployment - Railway + Vercel

## 📦 Arquitectura de Deployment Actualizada

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO FINAL                      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Vercel)                       │
│  • Next.js 14                                        │
│  • React Query                                       │
│  • TailwindCSS                                       │
│  • Auto-deploy desde GitHub                         │
└─────────────────────────────────────────────────────┘
                         │
                    HTTPS/WSS
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Railway)                       │
│  • NestJS                                            │
│  • Prisma ORM                                        │
│  • Bull Queue                                        │
│  • WhatsApp (Baileys)                               │
│  • Persistent Volumes (/app/wa-sessions)            │
└─────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌────────────────────┐      ┌────────────────────┐
│  PostgreSQL        │      │      Redis         │
│  (Railway)         │      │   (Railway)        │
│  • Managed DB      │      │   • Bull Queue     │
│  • Auto backups    │      │   • Cache          │
└────────────────────┘      └────────────────────┘
```

## 🎯 Por qué Railway + Vercel

### ✅ Ventajas de Railway sobre Render:

1. **Volúmenes Persistentes**: WhatsApp mantiene sesión incluso después de redeploys
2. **Mejor Performance**: Menos latencia y más confiable
3. **Deployment más rápido**: Builds optimizados con nixpacks
4. **Redis integrado**: Mejor para colas de trabajo
5. **Logs en tiempo real**: Mejor debugging

### ✅ Vercel para Frontend:

1. **Edge Network Global**: Latencia ultra-baja
2. **Auto-deploy**: Cada push a GitHub despliega automáticamente
3. **Preview Deployments**: Cada PR tiene su propia URL de preview
4. **Optimización automática**: Next.js optimizado para producción

## 📋 Pasos de Deployment

### 1️⃣ Backend en Railway

#### A. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Click "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Busca y selecciona `opentalk-wisp`

#### B. Crear Base de Datos

1. En tu proyecto de Railway, click "+ New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway crea automáticamente la base de datos
4. Copia el nombre del servicio (ej: "Postgres")

#### C. Crear Redis

1. Click "+ New" → "Database" → "Redis"
2. Railway crea automáticamente Redis
3. Copia el nombre del servicio (ej: "Redis")

#### D. Configurar Backend Service

1. Click "+ New" → "GitHub Repo"
2. Selecciona tu repositorio
3. Root Directory: `/`
4. Railway detecta automáticamente el monorepo

#### E. Configurar Variables de Entorno

En Railway Dashboard → Backend Service → Variables:

**Variables de Referencia** (click en "+ New Variable" → "Reference"):
```
DATABASE_URL → Reference → Postgres.DATABASE_URL
REDIS_URL → Reference → Redis.REDIS_URL
REDIS_HOST → Reference → Redis.REDIS_HOST
REDIS_PORT → Reference → Redis.REDIS_PORT
```

**Variables Manuales** (click en "+ New Variable"):
```bash
# JWT Configuration
JWT_SECRET=mekZudPUxXL29YqR5J2DvAIVAgRR15pyf9lK3zwNwhY=
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Environment
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
PORT=3000

# API
API_PREFIX=/api

# Frontend URL (actualizar con tu URL de Vercel)
FRONTEND_URL=https://opentalk-wisp-frontend.vercel.app
CORS_ORIGIN=https://opentalk-wisp-frontend.vercel.app

# OpenAI (opcional)
OPENAI_API_KEY=tu-api-key-aqui
OPENAI_MODEL=gpt-4-turbo-preview
```

#### F. Crear Volumen Persistente (CRÍTICO)

1. Backend Service → Settings → Volumes
2. Click "+ New Volume"
3. Configuración:
   - **Mount Path**: `/app/wa-sessions`
   - **Size**: 1 GB
4. Click "Add Volume"

**Sin este volumen, WhatsApp se desconectará en cada redeploy.**

#### G. Configurar Dominio Público

1. Backend Service → Settings → Networking
2. Click "Generate Domain"
3. Copia la URL (ej: `opentalk-wisp-backend-production.up.railway.app`)

#### H. Deploy

Railway hace deploy automáticamente cuando:
- Pusheas a GitHub
- Cambias variables de entorno
- Modificas la configuración

Ver logs en tiempo real: Backend Service → Deployments → Click en el deployment activo

### 2️⃣ Frontend en Vercel

#### A. Importar Proyecto

1. Ve a [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Importa desde GitHub: `opentalk-wisp`
4. Configure Project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `cd ../.. && pnpm install && pnpm build --filter=frontend`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

#### B. Configurar Variables de Entorno

En Vercel → Project Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://opentalk-wisp-backend-production.up.railway.app
```

**IMPORTANTE**: Usa la URL de Railway del paso 1.G

Apply to: ✅ Production, ✅ Preview, ✅ Development

#### C. Deploy

1. Click "Deploy"
2. Vercel hace build y deploy automáticamente
3. Cada push a `main` redespliega automáticamente

### 3️⃣ Verificación Post-Deploy

#### A. Verificar Backend

```bash
# Usar el script automático
./check-railway.sh https://tu-backend.railway.app

# O manualmente:
# Health check
curl https://tu-backend.railway.app/api/health/simple

# Database check
curl https://tu-backend.railway.app/api/health

# Test registro
curl -X POST https://tu-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org"
  }'
```

#### B. Verificar Frontend

1. Abre tu URL de Vercel
2. Intenta registrarte
3. Revisa la consola del navegador (F12)
4. No debe haber errores de CORS

#### C. Verificar WhatsApp

1. Login en el frontend
2. Ve a WhatsApp → Nueva Instancia
3. Escanea el QR
4. Verifica que se conecte
5. Redeploy el backend en Railway
6. Verifica que WhatsApp siga conectado (gracias al volumen persistente)

## 🔄 Workflow de Desarrollo

```
1. Desarrollo Local
   ├── Trabajas en tu rama
   ├── Commit cambios
   └── Push a GitHub

2. GitHub
   ├── Código actualizado
   └── Triggers automáticos

3. Railway (Backend)
   ├── Detecta cambio
   ├── Build automático
   ├── Tests (si están configurados)
   ├── Deploy a producción
   └── Rollback automático si falla

4. Vercel (Frontend)
   ├── Detecta cambio
   ├── Build automático
   ├── Preview deployment (en PRs)
   ├── Deploy a producción (en main)
   └── Old deployment sigue activo hasta que nuevo pase

5. Verificación
   └── ./check-railway.sh para verificar todo
```

## 🛠️ Comandos Útiles

### Ver Logs de Railway
```bash
# Instalar CLI de Railway
npm i -g @railway/cli

# Login
railway login

# Ver logs en tiempo real
railway logs
```

### Ejecutar Migraciones Manualmente
```bash
# En Railway Dashboard → Backend → Variables
# Agregar temporalmente:
RUN_MIGRATIONS=true

# O desde CLI:
railway run pnpm --filter=backend prisma migrate deploy
```

### Verificar Variables de Entorno
```bash
# En Railway
railway variables

# Ver valor específico
railway variables get DATABASE_URL
```

## 🐛 Troubleshooting

### Error: CORS blocked

**Síntoma**: `Access to XMLHttpRequest blocked by CORS policy`

**Solución**:
1. Verifica que `FRONTEND_URL` esté configurada en Railway
2. Debe ser la URL exacta de Vercel (con `https://`)
3. Redeploy el backend después de cambiar

### Error: Database connection failed

**Síntoma**: `Can't reach database server`

**Solución**:
1. Verifica que PostgreSQL esté creado en Railway
2. `DATABASE_URL` debe ser referencia: `${{Postgres.DATABASE_URL}}`
3. No manualmente la connection string

### Error: WhatsApp se desconecta

**Síntoma**: Cada redeploy pierde la sesión de WhatsApp

**Solución**:
1. Verifica que el volumen `/app/wa-sessions` exista
2. Backend Service → Settings → Volumes
3. Debe tener mount path exactamente: `/app/wa-sessions`

### Error: 502 Bad Gateway

**Síntoma**: Backend no responde

**Solución**:
1. Revisa logs en Railway
2. Verifica que el build haya completado
3. Check que `PORT=3000` esté configurado
4. Verifica que migraciones se ejecutaron

### Build falla en Railway

**Síntoma**: Error durante el build

**Solución**:
1. Revisa `nixpacks.toml` en la raíz
2. Verifica que `pnpm-lock.yaml` esté committeado
3. Check logs de Railway para error específico
4. Posiblemente falten dependencias

## 📊 Monitoreo

### Métricas en Railway
- Backend Service → Metrics
- CPU, Memoria, Network
- Request rate, Response time

### Logs
- Backend Service → Deployments → Active → Logs
- Logs en tiempo real
- Filtros por nivel (error, warn, info)

### Uptime Monitoring (Recomendado)
- [UptimeRobot](https://uptimerobot.com) (gratis)
- Ping cada 5 minutos a `/api/health/simple`
- Alertas por email/SMS si el servicio cae

## 💰 Costos Estimados

| Servicio | Plan | Costo/Mes | Uso |
|----------|------|-----------|-----|
| Railway - Backend | Starter | $5 | 500 GB egress |
| Railway - PostgreSQL | Included | $0 | Up to 1GB |
| Railway - Redis | Included | $0 | Up to 100MB |
| Vercel - Frontend | Hobby | $0 | 100GB bandwidth |
| **Total Estimado** | | **$5/mes** | Pequeñas empresas |

### Escala:
- **0-100 usuarios**: $5/mes (Railway Hobby + Vercel Free)
- **100-1000 usuarios**: $20/mes (Railway Starter)
- **1000+ usuarios**: $50+/mes (Railway Pro)

## 🚀 Optimizaciones

### Performance
- [ ] Configurar CDN para assets estáticos
- [ ] Implementar caché con Redis
- [ ] Optimizar queries de Prisma
- [ ] Lazy loading de componentes

### Seguridad
- [ ] Rate limiting en endpoints sensibles
- [ ] WAF con Cloudflare
- [ ] Rotación de JWT_SECRET periódica
- [ ] 2FA para usuarios admin

### Monitoreo
- [ ] Integrar Sentry para errores
- [ ] Analytics con PostHog
- [ ] Alertas con PagerDuty
- [ ] Logs centralizados con Datadog

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## ✅ Checklist de Deployment

- [ ] Backend deployado en Railway
- [ ] PostgreSQL creado y conectado
- [ ] Redis creado y conectado
- [ ] Volumen `/app/wa-sessions` creado
- [ ] Todas las variables de entorno configuradas
- [ ] Frontend deployado en Vercel
- [ ] `NEXT_PUBLIC_API_URL` apuntando a Railway
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] WhatsApp conecta y mantiene sesión
- [ ] CORS permite requests desde Vercel
- [ ] Script `check-railway.sh` pasa todos los checks
- [ ] Uptime monitoring configurado (recomendado)

---

**¿Problemas?** Consulta `RAILWAY_CONFIG.md` para troubleshooting detallado.
