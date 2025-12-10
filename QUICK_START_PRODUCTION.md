# 🚀 Quick Start - Railway Deploy (30 minutos)

## Opción más rápida para tener tu app en producción

---

## Paso 1: Preparar el Código (5 min)

### 1.1 Agregar archivo de configuración Railway

```bash
# Crear archivo railway.json en la raíz
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
```

### 1.2 Crear Dockerfiles (opcional, pero recomendado)

**Backend Dockerfile**: `apps/backend/Dockerfile`
```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
WORKDIR /app/apps/backend
RUN pnpm prisma generate
RUN pnpm build

FROM base AS deploy
WORKDIR /app
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/prisma ./prisma
COPY --from=build /app/apps/backend/package.json ./

EXPOSE 3001
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
```

**Frontend Dockerfile**: `apps/frontend/Dockerfile`
```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
WORKDIR /app/apps/frontend
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

FROM base AS deploy
WORKDIR /app
COPY --from=build /app/apps/frontend/.next ./.next
COPY --from=build /app/apps/frontend/node_modules ./node_modules
COPY --from=build /app/apps/frontend/package.json ./
COPY --from=build /app/apps/frontend/public ./public

EXPOSE 3000
CMD ["pnpm", "start"]
```

### 1.3 Push a GitHub

```bash
# Inicializar git si no está
git init
git add .
git commit -m "feat: prepare for production deployment"

# Crear repo en GitHub y push
git remote add origin https://github.com/tu-usuario/opentalk-wisp.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Configurar Railway (10 min)

### 2.1 Crear cuenta y proyecto

1. Ir a [railway.app](https://railway.app)
2. Sign up con GitHub
3. Click "New Project"
4. Seleccionar "Deploy from GitHub repo"
5. Seleccionar tu repositorio `opentalk-wisp`

### 2.2 Agregar PostgreSQL

1. En el proyecto de Railway, click "+ New"
2. Seleccionar "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Copiar la variable `DATABASE_URL` (la usaremos después)

---

## Paso 3: Configurar Backend (10 min)

### 3.1 Crear servicio Backend

1. En Railway, click "+ New" → "GitHub Repo"
2. Seleccionar tu repo
3. Railway detectará automáticamente el monorepo

### 3.2 Configurar variables de entorno

En el servicio Backend → Variables:

```env
# Railway auto-genera esto, solo agrégalo
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Genera un JWT secret seguro (32+ caracteres)
JWT_SECRET=tu-secret-super-seguro-aqui-minimo-32-caracteres-random

# Puerto
PORT=3001

# Node env
NODE_ENV=production

# Frontend URL (lo configuraremos después)
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

Para generar JWT_SECRET seguro:
```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Configurar Build y Start

En Railway → Settings:

**Root Directory**: `apps/backend`

**Build Command**:
```bash
pnpm install && pnpm prisma generate && pnpm build
```

**Start Command**:
```bash
pnpm prisma migrate deploy && pnpm start:prod
```

### 3.4 Deploy

1. Click "Deploy"
2. Esperar 2-3 minutos
3. Railway te dará una URL: `https://tu-backend.up.railway.app`

---

## Paso 4: Configurar Frontend (10 min)

### 4.1 Crear servicio Frontend

1. En Railway, click "+ New" → "GitHub Repo"
2. Seleccionar tu repo otra vez
3. Se creará otro servicio

### 4.2 Configurar variables de entorno

En el servicio Frontend → Variables:

```env
# URL del backend (usar la URL que te dio Railway)
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app
```

### 4.3 Configurar Build y Start

En Railway → Settings:

**Root Directory**: `apps/frontend`

**Build Command**:
```bash
pnpm install && pnpm build
```

**Start Command**:
```bash
pnpm start
```

### 4.4 Deploy

1. Click "Deploy"
2. Esperar 2-3 minutos
3. Railway te dará una URL: `https://tu-frontend.up.railway.app`

---

## Paso 5: Configurar CORS (5 min)

### 5.1 Actualizar CORS en backend

**Archivo**: `apps/backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://tu-frontend.up.railway.app', // ⬅️ Agregar tu URL de Railway
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  });
  
  // ... resto del código
}
```

### 5.2 Commit y push

```bash
git add .
git commit -m "fix: add Railway URL to CORS"
git push
```

Railway auto-desplegará los cambios.

---

## Paso 6: Verificar que Todo Funciona (5 min)

### 6.1 Checklist

✅ Backend:
```bash
# Verificar health endpoint
curl https://tu-backend.up.railway.app/health

# Debe responder: {"status":"ok","database":"connected"}
```

✅ Frontend:
1. Abrir `https://tu-frontend.up.railway.app`
2. Ir a `/register`
3. Crear una cuenta
4. Login
5. Ver dashboard

✅ Database:
1. En Railway → PostgreSQL → Query
2. Ejecutar: `SELECT * FROM "User";`
3. Debes ver tu usuario creado

---

## Paso 7: Configurar Dominio Personalizado (Opcional)

### 7.1 Si tienes un dominio

En Railway → Settings → Domains:

**Backend**:
- Custom domain: `api.tudominio.com`
- Railway genera certificado SSL automáticamente

**Frontend**:
- Custom domain: `tudominio.com` y `www.tudominio.com`

### 7.2 Configurar DNS

En tu proveedor de dominio:

```
Tipo CNAME:
api      → tu-backend.up.railway.app
@        → tu-frontend.up.railway.app
www      → tu-frontend.up.railway.app
```

Esperar 5-30 minutos para propagación DNS.

---

## Comandos Útiles Post-Deploy

### Ver Logs en Railway

```
Railway Dashboard → Tu Servicio → Logs
```

### Ejecutar migraciones manualmente

En Railway → Backend → Settings → "One-off Command":
```bash
pnpm prisma migrate deploy
```

### Ver base de datos

En Railway → PostgreSQL → Query:
```sql
-- Ver todas las tablas
\dt

-- Ver usuarios
SELECT * FROM "User";

-- Ver organizaciones
SELECT * FROM "Organization";

-- Ver contactos
SELECT * FROM "Contact";
```

### Rollback si algo sale mal

En Railway → Deployments → Seleccionar deploy anterior → "Redeploy"

---

## Troubleshooting

### Error: "Cannot connect to database"

**Solución**:
1. Verificar que `DATABASE_URL` esté configurada
2. En Railway → PostgreSQL → Connect → Copiar URL
3. Pegar en Backend → Variables → DATABASE_URL

### Error: "CORS blocked"

**Solución**:
1. Verificar que `FRONTEND_URL` esté en las variables del backend
2. Agregar tu URL de frontend a `main.ts`
3. Hacer commit y push

### Error: "Module not found"

**Solución**:
1. Borrar `node_modules` en local
2. `pnpm install`
3. Commit y push
4. Railway rebuildeará

### Error: "Prisma Client not generated"

**Solución**:
En Build Command agregar:
```bash
pnpm install && pnpm prisma generate && pnpm build
```

---

## Costos de Railway

**Plan Hobby** (recomendado para empezar):
- $5/mes por servicio
- $5 PostgreSQL
- $5 Backend
- $5 Frontend
- **Total: $15/mes**

**Plan Developer**:
- $10/mes
- $5 de crédito incluido
- Ideal si tienes 1-2 servicios

**Plan Pro**:
- $20/mes
- $10 de crédito incluido
- Para producción seria

**Tip**: Empieza con Hobby, migra a Pro cuando escales.

---

## Monitoreo Gratuito

### UptimeRobot (recomendado)

1. Ir a [uptimerobot.com](https://uptimerobot.com)
2. Crear cuenta gratuita
3. Agregar monitors:
   - Frontend: `https://tu-frontend.up.railway.app`
   - Backend: `https://tu-backend.up.railway.app/health`
4. Configurar alertas por email

### Railway Built-in Metrics

En Railway → Tu Servicio → Metrics:
- CPU usage
- Memory usage
- Network traffic
- Response time

---

## Backups Automáticos

Railway hace backups automáticos de PostgreSQL cada 24 horas.

Para backup manual:
```bash
# Conectar a PostgreSQL desde tu terminal local
# (obtén la URL en Railway → PostgreSQL → Connect)

pg_dump <DATABASE_URL> > backup_$(date +%Y%m%d).sql
```

---

## Siguiente Paso

✅ **Tu app está en producción!**

Ahora puedes:

1. **Compartir con usuarios**
   ```
   Frontend: https://tu-frontend.up.railway.app
   ```

2. **Configurar WhatsApp**
   - Ir a `/dashboard/whatsapp`
   - Crear instancia
   - Escanear QR
   - ¡Listo para recibir mensajes!

3. **Mejorar UI/UX**
   - Ver `UI_IMPROVEMENTS.md`
   - Implementar quick wins primero

4. **Monitorear**
   - Configurar UptimeRobot
   - Revisar logs en Railway
   - Configurar alertas

---

## Resumen

✅ Backend deployed con PostgreSQL  
✅ Frontend deployed  
✅ SSL automático (HTTPS)  
✅ Auto-deploy en cada push  
✅ Backups automáticos  
✅ Logs en tiempo real  
✅ Métricas de performance  

**Tiempo total: ~30-40 minutos**  
**Costo: $15/mes**

🎉 **¡Felicitaciones! Tu CRM con WhatsApp está en producción!**
