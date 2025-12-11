# 📦 Resumen de la Migración Render → Railway

## 🎯 Objetivo
Migrar el backend de Render a Railway para resolver problemas de persistencia de sesiones de WhatsApp.

---

## 📊 Estado Actual

### ✅ COMPLETADO

#### Código y Configuración
- ✅ Código actualizado para detectar Railway (`RAILWAY_ENVIRONMENT`)
- ✅ Directorio de sesiones WhatsApp: `/app/wa-sessions` (Railway persistente)
- ✅ `railway.json` configurado con health checks y restart policies
- ✅ `nixpacks.toml` optimizado para builds en Railway
- ✅ `.env.railway.example` con template de variables
- ✅ Scripts de setup y verificación creados

#### Documentación
- ✅ `RAILWAY_MIGRATION_COMPLETE.md` - Guía completa paso a paso
- ✅ `RAILWAY_QUICK_START.md` - Guía rápida (30 min)
- ✅ `railway-setup-helper.sh` - Script para generar configuración
- ✅ `verify-railway.sh` - Script para verificar deployment

---

## 🚀 Para Completar la Migración

### Usa uno de estos métodos:

#### Opción A: Rápida (30 min)
```bash
# 1. Generar configuración
./railway-setup-helper.sh

# 2. Seguir RAILWAY_QUICK_START.md
```

#### Opción B: Completa (con detalles)
```bash
# Seguir RAILWAY_MIGRATION_COMPLETE.md paso a paso
```

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
```
├── .env.railway.example          # Template de variables de entorno
├── RAILWAY_MIGRATION_COMPLETE.md # Guía completa de migración
├── RAILWAY_QUICK_START.md        # Guía rápida
├── railway-setup-helper.sh       # Script helper (genera JWT, etc)
├── verify-railway.sh             # Script de verificación
└── MIGRATION_SUMMARY.md          # Este archivo
```

### Archivos Modificados
```
├── railway.json         # Actualizado con health checks
├── nixpacks.toml        # Optimizado para Railway
└── .gitignore          # Agregado .env.railway
```

### Archivos Sin Cambios (ya estaban listos)
```
├── apps/backend/src/whatsapp/whatsapp.service.ts  # Ya detecta Railway
├── apps/backend/package.json                       # Scripts correctos
└── apps/backend/prisma/schema.prisma              # Sin cambios
```

---

## 🔑 Variables Clave para Railway

Estas son las variables CRÍTICAS que debes configurar:

```bash
# Identificación de Railway (para volumen persistente)
RAILWAY_ENVIRONMENT=production

# Base de datos y Redis (auto-generadas)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Seguridad (¡generar nuevo!)
JWT_SECRET=genera-uno-con-railway-setup-helper.sh

# CORS (actualizar con tu Vercel URL)
FRONTEND_URL=https://tu-frontend.vercel.app
CORS_ORIGIN=https://tu-frontend.vercel.app
```

---

## ⚡ Paso Crítico: Volumen Persistente

**NO OLVIDES ESTE PASO:**

En Railway Dashboard → Backend Service → Settings → Volumes:
```
Mount Path: /app/wa-sessions
Name: whatsapp-sessions
Size: 1 GB
```

Sin este volumen, las sesiones de WhatsApp se perderán al reiniciar (mismo problema que en Render).

---

## 🧪 Verificación Post-Deploy

Después del deploy, ejecuta:

```bash
./verify-railway.sh
```

O manualmente:
```bash
curl https://tu-backend.up.railway.app/api/health
```

Debe retornar:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

---

## 📋 Checklist Rápido

### En Railway:
- [ ] PostgreSQL creado
- [ ] Redis creado
- [ ] Backend conectado a GitHub
- [ ] Variables de entorno configuradas
- [ ] **Volumen persistente /app/wa-sessions creado** ⚠️
- [ ] Domain generado

### En Vercel (Frontend):
- [ ] `NEXT_PUBLIC_API_URL` actualizada con URL de Railway
- [ ] `NEXT_PUBLIC_WS_URL` actualizada con URL de Railway
- [ ] Frontend redeployeado

### Verificación:
- [ ] Health endpoint responde 200 OK
- [ ] Logs muestran "Railway Persistent Volume"
- [ ] WhatsApp QR se genera correctamente
- [ ] Sesión persiste después de redeploy

---

## 🔄 Cambios en el Flujo de Desarrollo

### Antes (Render):
```
git push → Render build → Deploy → ❌ Sesiones WhatsApp se pierden
```

### Ahora (Railway):
```
git push → Railway build → Deploy → ✅ Sesiones WhatsApp persisten
```

---

## 💡 Comandos Útiles

```bash
# Generar configuración inicial
./railway-setup-helper.sh

# Verificar deployment
./verify-railway.sh

# Ver logs (requiere Railway CLI)
railway logs

# SSH al contenedor (debug)
railway shell
ls -la /app/wa-sessions/
```

---

## 🐛 Problemas Comunes y Soluciones

### 1. WhatsApp se desconecta después de redeploy
**Causa:** Volumen no configurado o variable `RAILWAY_ENVIRONMENT` faltante  
**Solución:** 
- Verifica que `RAILWAY_ENVIRONMENT=production`
- Verifica que el volumen esté montado en `/app/wa-sessions`

### 2. Build falla con error de Prisma
**Causa:** `DATABASE_URL` no configurada  
**Solución:** Asegúrate que PostgreSQL esté creado primero

### 3. CORS bloqueado
**Causa:** `FRONTEND_URL` no configurada correctamente  
**Solución:** Verifica que `FRONTEND_URL` y `CORS_ORIGIN` tengan la URL de Vercel

### 4. Health endpoint retorna error
**Causa:** Migraciones no ejecutadas o DB no conectada  
**Solución:** Revisa logs, las migraciones se ejecutan en el start command

---

## 📊 Comparación de Costos

| Servicio | Render | Railway | Ahorro |
|----------|--------|---------|--------|
| Backend | $7/mes | $5/mes | $2/mes |
| PostgreSQL | Incluido | $5/mes | - |
| Redis | $10/mes | $5/mes | $5/mes |
| **Total** | **$17/mes** | **$15/mes** | **$2/mes** |

**Beneficios adicionales:**
- ✅ Volúmenes persistentes nativos
- ✅ Mejor performance
- ✅ Deploy más rápido
- ✅ Mejor DX (Developer Experience)

---

## 🎯 Próximos Pasos Después de la Migración

1. **Monitorear logs** durante las primeras 24 horas
2. **Probar conexión WhatsApp** exhaustivamente
3. **Actualizar documentación** del equipo con nueva URL
4. **Configurar alertas** (opcional) en Railway
5. **Agregar dominio custom** (opcional)

---

## 📚 Recursos de Referencia

- 🔗 [RAILWAY_MIGRATION_COMPLETE.md](RAILWAY_MIGRATION_COMPLETE.md) - Guía completa
- 🔗 [RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md) - Guía rápida
- 🔗 [RAILWAY_SETUP.md](RAILWAY_SETUP.md) - Guía original
- 🔗 [Railway Docs](https://docs.railway.app)
- 🔗 [Nixpacks Docs](https://nixpacks.com/docs)

---

## ✅ Estado de la Migración

```
CÓDIGO:        ✅ LISTO
CONFIGURACIÓN: ✅ LISTO
DOCUMENTACIÓN: ✅ LISTO
SCRIPTS:       ✅ LISTO

PENDIENTE:     🔄 Ejecutar pasos en Railway Dashboard
```

**Tiempo estimado para completar:** 30-45 minutos

---

## 🎉 ¡Todo Listo!

El proyecto está completamente preparado para migrar a Railway. 

**Siguiente paso:** Ejecuta `./railway-setup-helper.sh` y sigue [RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md)

---

**Fecha de preparación:** 11 de diciembre de 2025  
**Última actualización:** 11 de diciembre de 2025  
**Versión:** 1.0
