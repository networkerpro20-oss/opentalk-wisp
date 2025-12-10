# 🎯 RENDER - CONFIGURACIÓN EXACTA PASO A PASO

## ⚠️ LEE ESTO PRIMERO

Este archivo contiene la configuración **EXACTA** que debes usar en Render.
**COPIA Y PEGA exactamente como está escrito**. NO cambies nada.

---

## 📋 PASO 1: Settings → Build & Deploy

### Build Command:
```
./render-build.sh
```

### Start Command:
```
cd apps/backend && chmod +x start-production.sh && ./start-production.sh
```

### Root Directory:
```
(dejar VACÍO - no pongas nada)
```

### Branch:
```
main
```

---

## 📋 PASO 2: Environment Variables

Ve a Settings → Environment → Add Environment Variable

### Variable 1:
```
Key: DATABASE_URL
Value: postgresql://opentalk_wisp_db_user:EUX4V8GGzqnDHd6kpADqe6eAfUG2gsJd@dpg-d4sgrqvpm1nc73c2gq90-a.virginia-postgres.render.com/opentalk_wisp_db
```

### Variable 2:
```
Key: JWT_SECRET
Value: b0845aabe4cc98ef3185e1f8165e6001f1e03d0c94f093319019e897222e3312
```

### Variable 3:
```
Key: NODE_ENV
Value: production
```

### Variable 4:
```
Key: PORT
Value: 10000
```

### Variable 5:
```
Key: FRONTEND_URL
Value: https://opentalk-wisp-backend.vercel.app
```

---

## 📋 PASO 3: Advanced Settings

### Instance Type:
```
Free (para pruebas)
O
Starter - $7/mes (RECOMENDADO para producción)
```

### Health Check Path:
```
/api/health
```

### Auto-Deploy:
```
✅ Enabled
```

---

## ✅ VERIFICACIÓN

Después de guardar los cambios, ve a "Manual Deploy" y haz click en "Deploy latest commit".

### Logs Esperados (SUCCESS):

```
==> Building...
🚀 Iniciando build para Render...
📦 Instalando pnpm...
📦 Instalando dependencias del workspace...
🔧 Generando Prisma Client...
✅ Generated Prisma Client
🏗️  Building backend...
webpack 5.97.1 compiled successfully
✅ Build completado!

==> Starting service...
🚀 OpenTalkWisp Backend - Iniciando en producción...
✅ Directorio correcto: /opt/render/project/src/apps/backend
✅ DATABASE_URL configurada
🔧 Ejecutando migraciones de base de datos...
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database

Applying migration `20251210020543_opentalkwisp`
✅ Migraciones completadas exitosamente
✅ Build encontrado
🚀 Iniciando servidor NestJS en puerto 10000...

[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] LOG [InstanceLoader] ConfigModule dependencies initialized
✅ Database connected
[Nest] LOG [WhatsappService] Reconnecting WhatsApp instances...

🚀 OpenTalkWisp Backend is running!
📍 Environment: production
📍 Port: 10000
📍 API: /api
📍 Frontend URL: https://opentalk-wisp-backend.vercel.app
🏥 Health: /api/health
📖 Docs: /api/docs

==> Your service is live 🎉
```

---

## ❌ SI FALLA

### Error: "permission denied: start-production.sh"
**Solución**: Ya está resuelto con `chmod +x` en el Start Command

### Error: "DATABASE_URL not found"
**Solución**:
1. Ve a Environment
2. Verifica que DATABASE_URL esté ahí
3. Copia el valor EXACTO de arriba (incluye el `postgresql://...`)
4. NO pongas comillas ni espacios

### Error: "Out of memory"
**Solución**: 
1. Ve a Settings → Instance Type
2. Cambia de "Free" a "Starter" ($7/mes)
3. Starter tiene 512MB + burst hasta 1GB

### Error: "Table does not exist"
**Solución**: Las migraciones no se ejecutaron
1. Ve a Shell (en el dashboard de Render)
2. Ejecuta:
   ```bash
   cd apps/backend
   npx prisma migrate deploy
   ```
3. Luego redeploy manual

---

## 🧪 PROBAR QUE FUNCIONA

Una vez deployed, prueba el health endpoint:

```bash
curl https://TU-APP.onrender.com/api/health
```

Debe responder:
```json
{"status":"ok","database":"connected"}
```

---

## 📞 SIGUIENTE PASO: VERCEL (FRONTEND)

Una vez que el backend esté funcionando:

1. Ve a https://vercel.com
2. New Project
3. Import `networkerpro20-oss/opentalk-wisp`
4. Configure:
   ```
   Framework: Next.js
   Root Directory: apps/frontend
   Build Command: pnpm build
   Install Command: pnpm install
   ```
5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://TU-BACKEND.onrender.com
   ```
6. Deploy

---

## 📝 RESUMEN DE COMANDOS

```
Build Command:    ./render-build.sh
Start Command:    cd apps/backend && chmod +x start-production.sh && ./start-production.sh
Root Directory:   (vacío)
Health Check:     /api/health
```

**5 Environment Variables:**
- DATABASE_URL
- JWT_SECRET
- NODE_ENV=production
- PORT=10000  
- FRONTEND_URL

---

## ✅ COMMIT ACTUAL

Commit: `3714896` - Script de inicio robusto con validaciones

**Este es el commit correcto. Usa este.**

---

**IMPORTANTE**: Si después de seguir esto EXACTAMENTE sigue fallando, manda el log completo del deployment (todo el output desde "Building..." hasta el error).
