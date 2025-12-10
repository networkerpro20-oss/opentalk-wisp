# 🚀 GUÍA RÁPIDA: Deploy Render + Vercel

## ✅ PASO A PASO - Backend en Render (15 min)

### 1️⃣ Crear Base de Datos PostgreSQL

1. Ve a https://render.com y haz login con GitHub
2. Click **"New +"** → **"PostgreSQL"**
3. Configurar:
   - **Name**: `opentalk-postgres`
   - **Database**: `opentalk_wisp`
   - **Region**: Oregon (US West)
   - **Plan**: **Starter Plus ($7/mes)** ⬅️ IMPORTANTE: incluye DB + sin sleep
4. Click **"Create Database"**
5. **COPIAR** el "Internal Database URL":
   ```
   postgresql://opentalk:XXXXXXXXX@dpg-XXXXX/opentalk_wisp
   ```

### 2️⃣ Crear Web Service para Backend

1. En Render Dashboard → **"New +"** → **"Web Service"**
2. Click **"Connect repository"** → selecciona: `networkerpro20-oss/opentalk-wisp`
3. Configurar:

   ```
   Name:          opentalk-backend
   Region:        Oregon (mismo que la DB)
   Branch:        main
   Root Directory: (DEJAR VACÍO)
   Runtime:       Node
   
   Build Command:
   ./render-build.sh
   
   Start Command:
   cd apps/backend && node dist/main.js
   
   Plan:          Starter ($7/mes) - Ya incluye la DB
   ```

4. Scroll down a **"Environment Variables"** y agregar:

   ```env
   # 1. Database (pega la Internal URL que copiaste)
   DATABASE_URL=postgresql://opentalk:XXXXXXXXX@dpg-XXXXX/opentalk_wisp
   
   # 2. JWT Secret (genera uno nuevo)
   JWT_SECRET=usar-comando-abajo-para-generar
   
   # 3. Node Config
   NODE_ENV=production
   PORT=10000
   
   # 4. CORS (lo actualizaremos después de crear Vercel)
   FRONTEND_URL=https://tu-app.vercel.app
   ```

   **Generar JWT_SECRET** (copia el resultado):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Click **"Create Web Service"**
6. Espera 5-7 minutos mientras hace el build
7. Tu backend estará en: `https://opentalk-backend.onrender.com`

### 3️⃣ Verificar Backend

Una vez que el deploy termine (status "Live"):

```bash
# Verificar health endpoint
curl https://opentalk-backend.onrender.com/api/health

# Debe responder:
# {"status":"ok","timestamp":"2025-12-10..."}
```

---

## ✅ PASO A PASO - Frontend en Vercel (10 min)

### 1️⃣ Crear Proyecto en Vercel

1. Ve a https://vercel.com y haz login con GitHub
2. Click **"Add New..."** → **"Project"**
3. Selecciona repositorio: `networkerpro20-oss/opentalk-wisp`
4. Vercel detectará Next.js automáticamente

### 2️⃣ Configurar Framework

```
Framework Preset:    Next.js
Root Directory:      apps/frontend
Build Command:       pnpm build
Output Directory:    .next
Install Command:     pnpm install
```

### 3️⃣ Variables de Entorno

Click **"Environment Variables"** y agregar:

```env
# Backend API (usa la URL de Render que obtuviste)
NEXT_PUBLIC_API_URL=https://opentalk-backend.onrender.com

# Build
NODE_ENV=production
```

### 4️⃣ Deploy

1. Click **"Deploy"**
2. Espera 2-3 minutos
3. Tu app estará en: `https://opentalk-wisp-XXXXX.vercel.app`

### 5️⃣ Actualizar CORS en Backend

Una vez que tengas la URL de Vercel:

1. Ve a Render Dashboard → tu servicio backend
2. Click **"Environment"**
3. Edita la variable **FRONTEND_URL**:
   ```
   FRONTEND_URL=https://opentalk-wisp-XXXXX.vercel.app
   ```
4. Click **"Save Changes"**
5. Render redesplegará automáticamente (2-3 min)

---

## ✅ Verificar Todo Funciona

### 1. Abrir tu app en Vercel

```
https://opentalk-wisp-XXXXX.vercel.app
```

### 2. Probar Registro

1. Click **"Sign Up"**
2. Crear cuenta:
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - Organization: `Mi Empresa`
3. Debe redirigir al dashboard

### 3. Probar API desde el frontend

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('https://opentalk-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

Si ves `{status: "ok"}` → **¡TODO FUNCIONA! 🎉**

---

## 🎯 URLs Finales

Guarda estas URLs:

```
Frontend:  https://opentalk-wisp-XXXXX.vercel.app
Backend:   https://opentalk-backend.onrender.com
API Docs:  https://opentalk-backend.onrender.com/api
Database:  Panel en Render → PostgreSQL
```

---

## 💰 Costos

- **Vercel**: $0 (plan Hobby - gratis)
- **Render**: $7/mes (Starter plan con PostgreSQL incluido)
- **Total**: **$7/mes**

---

## 🔧 Comandos Útiles

### Ver logs en Render

```bash
# En Render Dashboard → tu servicio → "Logs" tab
# Ver en tiempo real
```

### Rollback en Vercel

```bash
# En Vercel Dashboard → tu proyecto → "Deployments"
# Click en deployment anterior → "Promote to Production"
```

### Actualizar código

```bash
# Local
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# Vercel y Render redesplegarán automáticamente
```

---

## ⚠️ Problemas Comunes

### Backend no inicia

**Síntoma**: Error 503 en Render

**Solución**:
1. Verifica logs en Render Dashboard
2. Asegúrate de que `DATABASE_URL` es correcta
3. Verifica que el script `render-build.sh` tenga permisos de ejecución

### CORS Error en Frontend

**Síntoma**: Error "CORS policy" en consola del navegador

**Solución**:
1. Verifica que `FRONTEND_URL` en Render sea exactamente la URL de Vercel (sin "/" al final)
2. Espera 2-3 min a que Render redesplegue
3. Limpia caché del navegador (Ctrl+Shift+R)

### Build falla en Render

**Síntoma**: "Build failed" después de varios minutos

**Causas comunes**:
- No se ejecutó `prisma generate`
- Falta variable `DATABASE_URL`
- Error de TypeScript

**Solución**:
1. Ve a Render → Logs → ver error exacto
2. Si es Prisma: asegúrate de que `postinstall` existe en `package.json`
3. Si es TypeScript: ejecuta `pnpm build` localmente primero

---

## 🎉 ¡Listo para Producción!

Tu app está ahora en producción con:

✅ Frontend en Vercel (CDN global)  
✅ Backend en Render (con auto-deploy)  
✅ PostgreSQL gestionado  
✅ SSL/HTTPS automático  
✅ CI/CD automático (push = deploy)  

**Próximos pasos**: Ve a `UI_IMPROVEMENTS.md` para mejorar el diseño.
