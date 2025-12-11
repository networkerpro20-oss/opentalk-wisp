# ✅ Railway Deployment Checklist

## 🔍 Estado Actual del Código
- ✅ Todos los errores de TypeScript corregidos
- ✅ Backend compila exitosamente (verificado localmente)
- ✅ Código pusheado a GitHub (commit 6546cbe)
- ✅ Railway detectará el push automáticamente

---

## 📋 Variables de Entorno Requeridas en Railway

### Backend Service (opentalk-wisp-backend):

```bash
# Base de Datos (Railway genera automáticamente)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway genera automáticamente)  
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}

# JWT Configuration
JWT_SECRET=tu-jwt-secret-super-seguro-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3000
```

### Verifica que TODAS estén configuradas:

1. Ve a **opentalk-wisp-backend** → **Variables**
2. Asegúrate que DATABASE_URL use la referencia: `${{Postgres.DATABASE_URL}}`
3. Verifica que JWT_EXPIRES_IN esté configurado

---

## 🗂️ Volumen Persistente para WhatsApp

**MUY IMPORTANTE:** Railway necesita un volumen para guardar sesiones de WhatsApp

### Crear Volumen:

1. Ve a **opentalk-wisp-backend** → **Settings** → **Volumes**
2. Click **+ New Volume**
3. Configurar:
   - **Mount Path:** `/app/wa-sessions`
   - **Size:** 1 GB (suficiente para empezar)

Sin este volumen, WhatsApp se desconectará cada vez que Railway reinicie el servicio.

---

## 🚀 Verificar Deployment

Una vez que el build termine:

### 1. Check Health Endpoint:
```bash
curl https://opentalk-wisp-backend-production.up.railway.app/api/health
```

Debería retornar:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### 2. Ver Logs en Railway:
- Click en el deployment activo
- Busca estos mensajes exitosos:
  ```
  ✅ Database connected
  ✅ Redis connected  
  ✅ Nest application successfully started
  ```

### 3. Obtener URL Pública:
- Ve a **Settings** → **Networking**
- Copia la URL (algo como: `https://opentalk-wisp-backend-production.up.railway.app`)

---

## 🔗 Conectar Frontend en Vercel

Una vez que Railway esté funcionando:

### 1. Ve a tu proyecto en Vercel

### 2. Configura Variables de Entorno:
```bash
NEXT_PUBLIC_API_URL=https://opentalk-wisp-backend-production.up.railway.app
```

### 3. Redeploy Frontend:
- Click en **Deployments**
- Click en los 3 puntos del último deployment
- Click **Redeploy**

---

## 🧪 Pruebas Post-Deployment

Una vez que ambos servicios estén corriendo:

### 1. Test de Login:
- Abre el frontend: `https://tu-frontend.vercel.app`
- Intenta hacer login
- Verifica que conecte con el backend

### 2. Test de WhatsApp:
- Ve a sección WhatsApp
- Crea nueva instancia
- Verifica que genere QR
- Escanea con tu teléfono
- **IMPORTANTE:** La sesión debe persistir después de refrescar

### 3. Test de Base de Datos:
- Crea un contacto
- Verifica que se guarde
- Refresca la página
- El contacto debe seguir ahí

---

## ❌ Troubleshooting

### Si el deployment falla:

1. **Ver logs completos en Railway**
2. Buscar errores específicos:
   - ❌ Database connection failed → Verificar DATABASE_URL
   - ❌ Redis connection failed → Verificar REDIS_URL
   - ❌ Port already in use → Railway asigna puerto automático (ignorar)

### Si WhatsApp se desconecta:

1. Verificar que el volumen esté montado en `/app/wa-sessions`
2. Ver logs para confirmar: `Using existing auth directory: /app/wa-sessions`
3. Si no existe, crear el volumen

### Si frontend no conecta con backend:

1. Verificar CORS en backend (ya configurado)
2. Verificar que NEXT_PUBLIC_API_URL esté correcta en Vercel
3. Verificar que la URL de Railway esté activa

---

## ✅ Checklist Final

- [ ] Railway build completado exitosamente
- [ ] Variables de entorno configuradas
- [ ] Volumen persistente creado para WhatsApp
- [ ] Health endpoint responde correctamente
- [ ] URL pública obtenida
- [ ] Frontend en Vercel actualizado con nueva URL
- [ ] Login funciona
- [ ] Base de datos guarda datos correctamente
- [ ] WhatsApp se conecta y persiste sesión

---

**Una vez completado todo esto, tendrás el stack completo funcionando en producción! 🚀**
