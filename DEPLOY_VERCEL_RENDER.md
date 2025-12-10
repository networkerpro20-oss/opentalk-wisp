# 🚀 Deploy a Vercel + Render (Producción)

## Opción: Frontend en Vercel + Backend en Render

Esta es una excelente combinación:
- **Vercel**: Gratis para frontend (Next.js optimizado)
- **Render**: $7/mes para backend + PostgreSQL gratis
- **Total: $7/mes** (más barato que Railway)

---

## Paso 1: Deploy Backend en Render (25 min)

### 1.1 Crear cuenta en Render

1. Ve a https://render.com
2. Sign up con GitHub
3. Conecta tu repositorio

### 1.2 Crear PostgreSQL Database

1. En Render Dashboard → "New +" → "PostgreSQL"
2. Configurar:
   ```
   Name: opentalk-postgres
   Database: opentalk_wisp
   User: opentalk
   Region: Oregon (US West) o el más cercano
   Plan: Free (para empezar)
   ```
3. Click "Create Database"
4. **Copiar "Internal Database URL"** (la usaremos después)

### 1.3 Crear Web Service para Backend

1. En Render Dashboard → "New +" → "Web Service"
2. Conectar repositorio: `networkerpro20-oss/opentalk-wisp`
3. Configurar servicio:

```
Name: opentalk-backend
Region: Oregon (mismo que DB)
Branch: main
Root Directory: (dejar vacío)
Runtime: Node

Build Command: 
./render-build.sh

Start Command: 
cd apps/backend && node dist/main.js

Plan: Starter ($7/mes) - Recomendado para producción
```

**IMPORTANTE**: No uses el plan Free para producción, se duerme cada 15 minutos.

### 1.4 Configurar Variables de Entorno

En "Environment" tab, agregar:

```env
# Database (usar la Internal URL que copiaste)
DATABASE_URL=postgresql://opentalk:***@***-postgres/opentalk_wisp

# JWT Secret (generar uno seguro)
JWT_SECRET=tu-secret-super-seguro-32-caracteres-minimo

# Node
NODE_ENV=production
PORT=10000

# Frontend URL (lo configuraremos después)
FRONTEND_URL=https://tu-app.vercel.app
```

Para generar JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.5 Deploy

1. Click "Create Web Service"
2. Render iniciará el build automáticamente
3. Espera 3-5 minutos
4. Tu backend estará en: `https://opentalk-backend.onrender.com`

**⚠️ Nota**: El plan gratuito de Render se "duerme" después de 15 min de inactividad. Considera el plan de $7/mes para producción seria.

---

## Paso 2: Deploy Frontend en Vercel (10 min)

### 2.1 Crear cuenta en Vercel

1. Ve a https://vercel.com
2. Sign up con GitHub
3. Click "Add New..." → "Project"

### 2.2 Importar Proyecto

1. Selecciona tu repositorio: `networkerpro20-oss/opentalk-wisp`
2. Vercel detectará Next.js automáticamente

### 2.3 Configurar Proyecto

```
Framework Preset: Next.js
Root Directory: apps/frontend
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

### 2.4 Variables de Entorno

En "Environment Variables", agregar:

```env
NEXT_PUBLIC_API_URL=https://opentalk-backend.onrender.com
```

### 2.5 Deploy

1. Click "Deploy"
2. Espera 2-3 minutos
3. Tu frontend estará en: `https://tu-app.vercel.app`

---

## Paso 3: Actualizar CORS en Backend (5 min)

Una vez que tengas tu URL de Vercel, necesitas actualizar el backend:

### 3.1 Actualizar variables en Render

1. Ve a Render Dashboard → Tu backend service
2. Environment → Editar `FRONTEND_URL`
3. Cambiar a: `https://tu-app.vercel.app`
4. Save Changes (se redesplegará automáticamente)

### 3.2 Verificar CORS en el código

El archivo `apps/backend/src/main.ts` ya debe tener:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL, // Tu URL de Vercel
  ],
  credentials: true,
});
```

Si no está, actualízalo y haz commit:

```bash
git add .
git commit -m "fix: update CORS for Vercel"
git push
```

Render redesplegará automáticamente.

---

## Paso 4: Configurar Dominio Personalizado (Opcional)

### En Vercel (Frontend)

1. Ve a tu proyecto → Settings → Domains
2. Agregar dominio: `tudominio.com`
3. Configurar DNS en tu proveedor:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### En Render (Backend)

1. Ve a tu servicio → Settings → Custom Domain
2. Agregar: `api.tudominio.com`
3. Configurar DNS:
   ```
   Type: CNAME
   Name: api
   Value: [valor que te da Render]
   ```

---

## Paso 5: Verificar que Todo Funciona

### 5.1 Probar Backend

```bash
# Health check
curl https://opentalk-backend.onrender.com/health

# Debe responder:
# {"status":"ok","database":"connected"}
```

### 5.2 Probar Frontend

1. Abre: `https://tu-app.vercel.app`
2. Ve a `/register`
3. Crea una cuenta
4. Login
5. ¡Listo! 🎉

---

## Configuración Avanzada

### Auto-deploy desde GitHub

Ambos servicios ya están configurados para auto-deploy:
- **Vercel**: Deploy en cada push a `main`
- **Render**: Deploy en cada push a `main`

### Monitoreo

**Render:**
- Dashboard → Tu servicio → Metrics
- Ver CPU, Memory, Response time

**Vercel:**
- Analytics incluido gratis
- Ver page views, performance, etc.

---

## Costos Detallados

### Plan Gratuito (Para Testing)

| Servicio | Costo | Limitaciones |
|----------|-------|--------------|
| Vercel (Frontend) | $0 | 100 GB bandwidth/mes |
| Render PostgreSQL | $0 | 1 GB storage, expira en 90 días |
| Render Backend | $0 | Se duerme después de 15 min inactividad |
| **Total** | **$0/mes** | Solo para desarrollo |

### Plan Producción (Recomendado)

| Servicio | Costo | Beneficios |
|----------|-------|------------|
| Vercel Pro (Frontend) | $0 (hobby) | Suficiente para empezar |
| Render Starter (Backend) | $7/mes | Siempre activo, SSL incluido |
| Render PostgreSQL | $7/mes | 1 GB storage, backups |
| **Total** | **$14/mes** | Producción estable |

---

## Alternativa: Todo en Render

Si prefieres tener todo en un solo lugar:

### Frontend + Backend en Render

```
Backend: $7/mes (Starter)
Frontend: $7/mes (Starter) - o usar Static Site gratis
PostgreSQL: Gratis (con limitaciones) o $7/mes
Total: $7-14/mes
```

Para deploy de frontend en Render:

1. New + → Static Site
2. Repo: `networkerpro20-oss/opentalk-wisp`
3. Root: `apps/frontend`
4. Build: `pnpm build && pnpm export`
5. Publish: `out`

---

## Comandos Útiles

### Ver logs en Render

```
Dashboard → Tu servicio → Logs
```

### Redeployar manualmente

```
Dashboard → Tu servicio → Manual Deploy → Deploy latest commit
```

### Rollback

```
Dashboard → Tu servicio → Events → Seleccionar deploy anterior → Redeploy
```

### Ejecutar migraciones manualmente

En Render, ve a Shell y ejecuta:
```bash
cd /opt/render/project/src
pnpm prisma migrate deploy
```

---

## Troubleshooting

### Error: "Cannot connect to database"

**Solución:**
1. Verificar que `DATABASE_URL` en Render tenga la Internal URL
2. No uses la External URL (no funcionará)
3. Formato: `postgresql://user:pass@internal-host/db`

### Error: "CORS blocked"

**Solución:**
1. Actualizar `FRONTEND_URL` en Render con tu URL de Vercel
2. Verificar que `main.ts` incluya `process.env.FRONTEND_URL` en CORS
3. Hacer commit y push para redesplegar

### Error: "Service Unavailable" en Render (plan free)

**Causa:** El servicio se durmió después de 15 min de inactividad

**Solución:**
1. Esperar 30-60 segundos (se está despertando)
2. O upgrade a plan Starter ($7/mes) para que esté siempre activo

### Build falla en Render

**Solución:**
1. Verificar que Build Command sea correcta
2. Asegurar que `pnpm-workspace.yaml` esté en la raíz
3. Ver logs completos en Dashboard → Logs

### Vercel no encuentra el proyecto

**Solución:**
1. Asegurar que Root Directory sea `apps/frontend`
2. Verificar que `package.json` exista en `apps/frontend`

---

## Monitoreo Gratuito

### UptimeRobot (Gratis)

1. Ve a https://uptimerobot.com
2. Agregar monitor para backend:
   - URL: `https://opentalk-backend.onrender.com/health`
   - Interval: 5 minutos
3. Configurar alertas por email

Esto mantiene tu servicio de Render despierto (en plan free) y te alerta si hay problemas.

---

## Backups de Base de Datos

### Render PostgreSQL

**Plan Free:** No incluye backups automáticos

**Plan Starter ($7/mes):** Backups diarios automáticos

**Backup Manual:**
```bash
# Desde tu terminal local
pg_dump "postgresql://user:pass@external-host/db" > backup.sql

# Restaurar
psql "postgresql://user:pass@external-host/db" < backup.sql
```

---

## Mejores Prácticas

1. **Usar plan pagado de Render** ($7/mes) en producción para evitar sleep
2. **Configurar UptimeRobot** para mantener el servicio activo
3. **Habilitar auto-deploy** desde GitHub (ya configurado)
4. **Revisar logs regularmente** en Render Dashboard
5. **Configurar dominios personalizados** para profesionalismo
6. **Backups manuales** de DB semanalmente (si usas plan free)

---

## Siguiente Paso

Una vez deployed:

1. ✅ Probar registro de usuario
2. ✅ Conectar WhatsApp con QR
3. ✅ Enviar mensaje de prueba
4. ✅ Ver mejoras de UI: `UI_IMPROVEMENTS.md`

---

## Resumen

**Vercel + Render = Mejor opción precio/calidad**

✅ Frontend gratis en Vercel  
✅ Backend $7/mes en Render  
✅ PostgreSQL gratis o $7/mes  
✅ SSL automático incluido  
✅ Auto-deploy desde GitHub  
✅ Fácil de configurar  

**Total: $7-14/mes**

---

**¿Dudas?** Revisa los logs en cada plataforma o consulta:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
