# Configuración de Railway - OpenTalkWisp

## ⚠️ IMPORTANTE: Configuración Requerida

El proyecto ha sido migrado de Render a Railway. Para que funcione correctamente, especialmente el **registro de usuarios**, necesitas configurar lo siguiente en Railway:

## 🗄️ Base de Datos PostgreSQL

### 1. Verificar que PostgreSQL esté creado en Railway:
- Ve a tu proyecto en Railway
- Debe haber un servicio PostgreSQL creado
- Railway auto-genera la variable `DATABASE_URL`

### 2. Ejecutar migraciones (Railway lo hace automáticamente):
El archivo `nixpacks.toml` ya incluye:
```toml
[start]
cmd = "cd apps/backend && pnpm prisma migrate deploy && node dist/main.js"
```

Esto ejecuta las migraciones antes de iniciar el servidor.

## 🔧 Variables de Entorno Requeridas

### En Railway Dashboard → Tu Servicio Backend → Variables:

#### Variables Automáticas (Referencias):
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}  
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
```

#### Variables Manuales Requeridas:
```bash
# JWT (CRÍTICO para autenticación)
JWT_SECRET=mekZudPUxXL29YqR5J2DvAIVAgRR15pyf9lK3zwNwhY=
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Node Environment
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
PORT=3000

# API Configuration
API_PREFIX=/api

# CORS y Frontend (ACTUALIZAR CON TU URL DE VERCEL)
FRONTEND_URL=https://opentalk-wisp-frontend.vercel.app
CORS_ORIGIN=https://opentalk-wisp-frontend.vercel.app

# OpenAI (Opcional - para features de IA)
OPENAI_API_KEY=tu-api-key-aqui
OPENAI_MODEL=gpt-4-turbo-preview
```

## 💾 Volumen Persistente (CRÍTICO para WhatsApp)

### Crear Volumen:
1. Ve a Railway → Tu Servicio Backend → Settings → Volumes
2. Click en "+ New Volume"
3. Configuración:
   - **Mount Path**: `/app/wa-sessions`
   - **Size**: 1 GB (mínimo)
4. Guardar

**Sin este volumen, WhatsApp se desconectará cada vez que se reinicie el servicio.**

## 🌐 Configuración de CORS Actualizada

El backend ahora permite automáticamente:
- ✅ Todos los subdominios de `*.vercel.app`
- ✅ URLs configuradas en `FRONTEND_URL`
- ✅ Localhost (desarrollo)

Esto resuelve los errores de CORS que viste en la consola.

## 🧪 Verificar que Todo Funciona

### 1. Verificar Health del Backend:
```bash
curl https://[tu-backend-railway-url].railway.app/api/health/simple
```

Debe responder:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### 2. Verificar Database:
```bash
curl https://[tu-backend-railway-url].railway.app/api/health
```

Debe mostrar:
```json
{
  "status": "ok",
  "info": {
    "database": {"status": "up"},
    "redis": {"status": "up"}
  }
}
```

### 3. Probar Registro de Usuario:
```bash
curl -X POST https://[tu-backend-railway-url].railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org"
  }'
```

Si responde con un token JWT, ¡la base de datos funciona! ✅

## 🔄 Configurar Vercel con URL de Railway

### 1. Obtener URL de Railway:
- Ve a Railway → Tu Servicio → Settings → Networking
- Copia la URL pública (ej: `opentalk-wisp-backend-production.up.railway.app`)

### 2. Configurar en Vercel:
- Ve a Vercel → Tu Proyecto → Settings → Environment Variables
- Actualiza o agrega:
  ```
  NEXT_PUBLIC_API_URL=https://opentalk-wisp-backend-production.up.railway.app
  ```
- Aplica a: Production, Preview, Development
- Redeploy

## 🐛 Solución de Problemas

### Error: "Access to XMLHttpRequest blocked by CORS"
**Causa**: La URL del frontend no está en las variables de entorno del backend.

**Solución**:
1. Agrega tu URL de Vercel en Railway:
   ```
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```
2. Redeploy el backend

### Error: "net::ERR_FAILED"
**Causa**: El backend de Railway no está respondiendo.

**Solución**:
1. Verifica que el servicio esté "Active" en Railway
2. Revisa los logs de Railway para errores
3. Verifica que las migraciones se ejecutaron correctamente

### Error: Database connection failed
**Causa**: `DATABASE_URL` no está configurada o es incorrecta.

**Solución**:
1. Verifica que PostgreSQL esté creado en Railway
2. Configura la variable como referencia:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

### WhatsApp se desconecta al reiniciar
**Causa**: No hay volumen persistente configurado.

**Solución**:
1. Crea el volumen en `/app/wa-sessions` (ver arriba)
2. Redeploy el servicio

## 📋 Checklist de Configuración

- [ ] PostgreSQL creado en Railway
- [ ] Redis creado en Railway
- [ ] Variables de entorno configuradas (ver arriba)
- [ ] Volumen persistente creado (`/app/wa-sessions`)
- [ ] Backend deployado y respondiendo en `/api/health`
- [ ] URL de Railway configurada en Vercel
- [ ] Frontend deployado en Vercel
- [ ] Probado registro de usuario exitoso
- [ ] Probado login exitoso
- [ ] WhatsApp mantiene sesión después de redeploy

## 🚀 Próximos Pasos

Una vez completada esta configuración:

1. **Prueba el Registro**: Intenta crear una cuenta desde el frontend
2. **Prueba WhatsApp**: Crea una instancia y escanea el QR
3. **Verifica Persistencia**: Redeploy el backend y verifica que WhatsApp siga conectado
4. **Prueba Features**: Deals, Analytics, Campaigns, etc.

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Railway
2. Verifica las variables de entorno
3. Consulta este documento
4. Revisa `RAILWAY.md` para detalles de migración
