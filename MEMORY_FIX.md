# 🚨 SOLUCIÓN: Out of Memory en Render

## ⚠️ Problema
Tu backend está consumiendo más de 512MB de RAM en Render Free Plan.

## ✅ Optimizaciones Aplicadas (Commit 7f97225)

1. **Node.js Heap Limit**: `--max-old-space-size=460` (deja 52MB para sistema)
2. **Baileys Cache Reducido**: `msgRetryCounterCache: undefined`
3. **Build Optimizado**: Solo dependencias de producción (`--prod`)
4. **Logs Reducidos**: `printQRInTerminal: false`

## 📊 Opciones

### Opción 1: Probar con Optimizaciones (GRATIS) ✅
**Acabas de subir estas optimizaciones.**

**Ve a Render:**
1. Dashboard → Tu servicio
2. Manual Deploy → Deploy latest commit (`7f97225`)
3. Mira los logs - debería usar ~400-450MB

**Si funciona:** ¡Listo! Tienes backend gratis
**Si sigue fallando:** Continúa a Opción 2 o 3

---

### Opción 2: Upgrade a Render Starter ($7/mes) 💰 RECOMENDADO

**Beneficios:**
- ✅ 512MB RAM garantizados + burst hasta 1GB
- ✅ Siempre activo (no se duerme)
- ✅ SSL incluido
- ✅ Mejor performance
- ✅ Ideal para producción

**Cómo hacer upgrade:**
1. Dashboard → Tu servicio → Settings
2. Scroll a "Instance Type"
3. Cambiar de "Free" a "Starter" ($7/mes)
4. Save Changes
5. Se redesplegará automáticamente

---

### Opción 3: Railway (Alternativa, ~$5/mes) 🚂

Railway cobra por uso real (no mensualidad fija):
- 512MB RAM = ~$5/mes
- 1GB RAM = ~$10/mes

**Ventajas vs Render:**
- Pago por uso (no mensualidad)
- Métricas más detalladas
- Mejor UI

**Desventajas:**
- Más caro si usas mucho
- Requiere tarjeta de crédito

**Setup Railway:**
```bash
# Instalar CLI
npm install -g railway

# Login
railway login

# Crear proyecto
railway init

# Agregar PostgreSQL
railway add -d postgres

# Deploy
railway up
```

Consulta: `DEPLOY_RAILWAY.md` para guía completa

---

### Opción 4: Fly.io (Alternativa, ~$5-10/mes) ✈️

**Ventajas:**
- 256MB RAM gratis
- Scaling automático
- PostgreSQL incluido

**Setup Fly.io:**
```bash
# Instalar CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Agregar PostgreSQL
flyctl postgres create
```

---

## 🎯 Recomendación

### Para Testing/MVP:
**✅ Opción 1** (Optimizaciones) - Gratis, acabas de aplicarlas

### Para Producción Seria:
**✅ Opción 2** (Render Starter $7/mes) - Más confiable, siempre activo

### Para Presupuesto Limitado:
**✅ Opción 3** (Railway ~$5/mes) - Pago por uso real

---

## 📈 Monitoreo de Memoria

Una vez deployed, monitorea el uso:

**Render:**
Dashboard → Tu servicio → Metrics → Memory

**Valores normales:**
- Idle: 200-300MB
- Con actividad: 350-450MB
- Pico máximo: <480MB (para evitar OOM)

Si pasa de 480MB consistentemente, necesitas upgrade.

---

## 🔧 Optimizaciones Adicionales (Si Aún Falla)

### 1. Reducir Workers de NestJS

En `main.ts`:
```typescript
const workers = process.env.NODE_ENV === 'production' ? 1 : 'auto';
```

### 2. Lazy Loading de Módulos

En `app.module.ts`:
```typescript
imports: [
  WhatsappModule, // Cargar solo cuando se use
],
```

### 3. Reducir Timeout de Baileys

En `whatsapp.service.ts`:
```typescript
defaultQueryTimeoutMs: 20000, // Reducir de 30s a 20s
connectTimeoutMs: 20000,
keepAliveIntervalMs: 40000,
```

---

## ✅ Siguiente Paso

1. **Prueba las optimizaciones actuales** (ya subidas en commit `7f97225`)
2. **Si funciona:** ¡Listo! Backend gratis en Render
3. **Si falla:** Upgrade a Render Starter ($7/mes)

**Trigger el deployment ahora y dime qué dice el log.**
