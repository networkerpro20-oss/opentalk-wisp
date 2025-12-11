# 🚂 Railway Configuration Guide - OpenTalkWisp

## ✅ Estado Actual

Tu proyecto Railway está configurado con:
- ✅ PostgreSQL Database (opentalk-wisp-db)
- ✅ Redis (opentalk-wisp-redis)
- ✅ Backend conectado a GitHub
- 🔄 Build en progreso

---

## 📋 PASO 1: Configurar Variables de Entorno

Ve al servicio **opentalk-wisp-backend** en Railway y agrega estas variables:

### Variables Requeridas:

```bash
# Database (Railway lo genera automáticamente)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway lo genera automáticamente)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (genera uno nuevo o usa el de Render)
JWT_SECRET=tu-jwt-secret-super-seguro-aqui-cambiar-en-produccion

# App Config
NODE_ENV=production
PORT=3000

# JWT Config
JWT_EXPIRES_IN=7d

# Redis Config (extraído de REDIS_URL)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
```

### Variables Opcionales:

```bash
# OpenAI (para funciones de IA)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Email (para notificaciones - futuro)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-password-app
```

---

## 📋 PASO 2: Configurar Volumen Persistente para WhatsApp

**IMPORTANTE:** Railway necesita un volumen persistente para las sesiones de WhatsApp.

### En Railway Dashboard:

1. Ve a **opentalk-wisp-backend** → **Settings** → **Volumes**
2. Haz clic en **+ New Volume**
3. Configura:
   - **Mount Path:** `/app/wa-sessions`
   - **Name:** `whatsapp-auth-storage`

Esto evitará que las sesiones de WhatsApp se pierdan al reiniciar.

---

## 📋 PASO 3: Verificar Build Settings

En **opentalk-wisp-backend** → **Settings** → **Deploy**:

### Build Command:
```bash
pnpm install && cd apps/backend && pnpm prisma generate && pnpm build
```

### Start Command:
```bash
cd apps/backend && pnpm prisma migrate deploy && pnpm start:prod
```

### Root Directory:
```
/
```

### Node Version:
```
18.x
```

---

## 📋 PASO 4: Actualizar Código para Railway Volumes

Después de configurar el volumen, el código ya está listo para usar:
- En development: `wa-auth/` (local)
- En production Railway: `/app/wa-sessions/` (volumen persistente)

---

## 📋 PASO 5: Obtener URL y Actualizar Frontend

1. Una vez que el build termine, Railway te dará una URL tipo:
   ```
   https://opentalk-wisp-backend-production.up.railway.app
   ```

2. Copia esa URL

3. Ve a tu proyecto en **Vercel** (frontend)

4. Actualiza la variable de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://opentalk-wisp-backend-production.up.railway.app
   ```

5. Redeploy el frontend en Vercel

---

## 🎯 Checklist Completo

- [ ] Variables de entorno configuradas en Railway
- [ ] Volumen persistente `/app/wa-sessions` creado
- [ ] Build completado exitosamente
- [ ] Migraciones de base de datos ejecutadas
- [ ] URL pública generada
- [ ] Frontend actualizado con nueva URL
- [ ] WhatsApp conectado y persistente

---

## 🐛 Troubleshooting

### Si el build falla:

1. Revisa los logs en Railway → **Deployments** → Click en el deployment
2. Busca errores de Prisma o TypeScript
3. Verifica que todas las dependencias estén en package.json

### Si WhatsApp se desconecta:

1. Verifica que el volumen esté montado en `/app/wa-sessions`
2. Revisa los logs para confirmar que está usando el volumen
3. Asegúrate que NODE_ENV=production

### Si la base de datos no conecta:

1. Verifica que `DATABASE_URL` esté configurada
2. Verifica que las migraciones se ejecuten en el start command
3. Revisa logs de PostgreSQL en Railway

---

## 📞 Siguiente Paso

Una vez configuradas las variables de entorno y el volumen:

1. Haz un **Manual Deploy** en Railway
2. Monitorea los logs
3. Verifica que el health endpoint funcione:
   ```
   https://tu-url.up.railway.app/api/health
   ```
