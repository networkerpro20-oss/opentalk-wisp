# 🔧 Solución Definitiva: Error 401 Conflict en WhatsApp Baileys

## 🎯 Diagnóstico Final

El error **401 Conflict** ocurre cuando las credenciales guardadas en el servidor (carpeta `wa-sessions`) ya no coinciden con lo que WhatsApp espera. Es como intentar entrar a tu casa con una llave vieja.

### ⚠️ Síntomas del Problema:
- ✅ QR se genera correctamente
- ✅ Usuario escanea el QR
- ✅ Muestra "connected" por ~2 segundos
- ❌ Se desconecta con "Stream Errored (conflict)" - Status 401
- ❌ Backend retorna 502 Bad Gateway

---

## 🚀 Solución Implementada

### 1️⃣ **LA PURGA** (Paso Crítico)

**ANTES de desplegar el nuevo código, DEBES limpiar las sesiones corruptas:**

#### En Railway:

1. Ve a tu proyecto en Railway Dashboard
2. Haz clic en tu servicio (Backend)
3. Ve a la pestaña **Volumes**
4. Entra al volumen `opentalk-wisp-backend-volume`
5. **BORRA todas las carpetas** dentro de `/app/wa-sessions/`
   - Cada carpeta representa una instancia (por ID)
   - Ejemplo: `/app/wa-sessions/84b823e1-8d2e-44b1-b1fd-9fa006f5da8b`
   - **Elimina TODAS** para forzar QR limpios

#### ⚡ Método Rápido (Desde Railway CLI):

```bash
# Si tienes railway CLI instalado
railway run rm -rf /app/wa-sessions/*
```

#### 🔄 Método Manual (Sin CLI):

1. En Railway Dashboard > Backend Service
2. Settings > Deploy Trigger
3. Agrega una variable temporal:
   ```
   CLEAR_SESSIONS=true
   ```
4. El backend detectará esto y limpiará automáticamente (código ya incluido)
5. Después de 1 minuto, ELIMINA la variable `CLEAR_SESSIONS`

---

### 2️⃣ **Cambios en el Código**

#### ✅ Mejoras Implementadas:

**a) Browser String Correcto**
```typescript
browser: ['Ubuntu', 'Chrome', '20.0.04'],
```
- Antes decía "Baileys" → WhatsApp lo bloqueaba
- Ahora simula Chrome en Ubuntu → Conexión estable

**b) Pino Logger (Reduce Ruido)**
```typescript
logger: pino({ level: 'silent' }),
```
- Menos logs = menos memoria consumida en Railway

**c) Manejo Inteligente del Error 401**
```typescript
if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
  this.logger.error(`❌ ERROR CRÍTICO: Sesión corrupta (${statusCode})`);
  this.logger.error(`💡 Solución: Elimina "${authPath}" y regenera QR`);
  // NO reconectar automáticamente para evitar bucles infinitos
  return;
}
```
- Detecta el 401 y **NO intenta reconectar** a lo loco
- Previene ban temporal de IP por WhatsApp

**d) makeCacheableSignalKeyStore Optimizado**
```typescript
keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
```
- Evita que la RAM se dispare al procesar llaves de encriptación
- Ayuda a prevenir errores 502 por memoria

**e) Timeouts Aumentados**
```typescript
connectTimeoutMs: 60000,
keepAliveIntervalMs: 10000,
```
- Evita desconexiones por internet lento en Railway

---

### 3️⃣ **Optimización de Memoria (Railway)**

#### railway.json
```json
{
  "deploy": {
    "startCommand": "cd apps/backend && pnpm prisma migrate deploy && node --max-old-space-size=400 dist/main.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "healthcheckPath": "/api/health/simple",
    "healthcheckTimeout": 100
  }
}
```

**Cambios clave:**
- `--max-old-space-size=400`: Limita Node.js a 400MB (deja 112MB para el SO)
- `restartPolicyMaxRetries: 5`: Reducido de 10 a 5 para evitar reintentos infinitos
- `healthcheckTimeout: 100`: Optimizado para respuestas rápidas

#### nixpacks.json
```json
{
  "providers": ["node"],
  "phases": {
    "setup": {
      "nixPkgs": ["git", "python3", "gcc", "gnumake", "vips"]
    }
  }
}
```

**¿Por qué estas librerías?**
- `vips`: Procesar imágenes de WhatsApp sin consumir toda la RAM
- `gcc` + `gnumake`: Compilar módulos nativos de Baileys
- `python3`: Dependencia de algunos módulos Node

---

### 4️⃣ **Dependencias Actualizadas**

#### package.json
```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "latest",
    "pino": "^8.17.2"
  }
}
```

**IMPORTANTE:** Usamos `"latest"` para Baileys porque WhatsApp actualiza sus nodos frecuentemente. Esto asegura compatibilidad.

---

## 📋 Checklist de Despliegue

### Antes de Deployar:

- [ ] 1. **BORRAR** todas las carpetas en `/app/wa-sessions/` en Railway
- [ ] 2. Verificar que `railway.json` tenga `--max-old-space-size=400`
- [ ] 3. Confirmar que `nixpacks.json` existe en la raíz
- [ ] 4. Asegurar que `package.json` tiene `baileys@latest` y `pino`

### Durante el Deploy:

- [ ] 5. Hacer commit y push de los cambios
- [ ] 6. Esperar a que Railway termine el build (~3-5 min)
- [ ] 7. Verificar logs de Railway: Debe mostrar `📱 Using WA v2.x.x, isLatest: true`

### Después del Deploy:

- [ ] 8. En el frontend, **ELIMINAR** todas las instancias antiguas
- [ ] 9. Crear una **nueva instancia** de WhatsApp
- [ ] 10. Escanear el QR con tu teléfono
- [ ] 11. Verificar que se conecte **SIN desconectar**

---

## 🔍 Debugging

### Si sigue fallando con 401:

**1. Verificar que el volumen está montado:**
```bash
# En Railway CLI
railway run ls -la /app/wa-sessions
```
Debe mostrar permisos de escritura (`drwxr-xr-x`).

**2. Ver logs en tiempo real:**
```bash
railway logs --tail
```
Busca estas líneas:
```
✅ Created auth path: /app/wa-sessions/[instance-id]
📱 Using WA v2.3020.1014, isLatest: true
📱 QR Code generated for instance [id]
✅ WhatsApp instance [id] connected successfully!
```

**3. Si dice "isLatest: false":**
```bash
# En local, fuerza reinstalar Baileys
cd apps/backend
pnpm remove @whiskeysockets/baileys
pnpm add @whiskeysockets/baileys@latest
git add package.json pnpm-lock.yaml
git commit -m "chore: Force update Baileys to latest"
git push
```

**4. Si el error persiste después de 3 intentos:**
- El número podría estar temporalmente bloqueado por WhatsApp
- **Solución:** Espera 24 horas antes de volver a escanear
- Usa un número diferente mientras tanto

---

## 🎉 Resultado Esperado

Después de aplicar estos cambios, al escanear el QR deberías ver en los logs:

```
🔄 Initializing WhatsApp connection for instance [id]
📁 Auth path: /app/wa-sessions/[id]
✅ Created auth path: /app/wa-sessions/[id]
📱 Using WA v2.3020.1014, isLatest: true
📱 QR Code generated for instance [id] (valid for ~40 seconds)
✅ WhatsApp instance [id] connected successfully! Phone: 5219983950232
```

Y la instancia permanecerá **CONECTADA** sin desconectarse.

---

## 🚨 Errores Comunes Post-Fix

### Error: "Cannot read property 'creds' of undefined"
**Causa:** No se borró la carpeta de sesiones corrupta.  
**Solución:** Vuelve al Paso 1️⃣ y elimina `/app/wa-sessions/[instance-id]`.

### Error: "502 Bad Gateway"
**Causa:** Memoria insuficiente.  
**Solución:** Verifica que `railway.json` tenga `--max-old-space-size=400`.

### Error: "AuthenticationCreds version mismatch"
**Causa:** Baileys no se actualizó correctamente.  
**Solución:** Fuerza reinstalación (ver punto 3 del Debugging).

---

## 📞 Soporte

Si después de seguir TODOS los pasos sigue fallando:

1. Comparte los logs completos de Railway (últimas 50 líneas)
2. Indica la versión de Baileys que se instaló (`📱 Using WA v...`)
3. Confirma que **SÍ borraste** las carpetas de `/app/wa-sessions/`

---

## 🔄 Mantenimiento

### Cada vez que actualices el backend:

- **NO es necesario** borrar las sesiones
- Las conexiones deberían persistir automáticamente

### Si despliegas una nueva instancia desde cero:

- **SÍ debes** borrar las sesiones viejas antes del primer deploy

---

**Última actualización:** 12 de diciembre de 2025  
**Versión de Baileys probada:** latest (v6.7.5+)  
**Entorno:** Railway (512MB RAM) + PostgreSQL + Redis
