# 🚨 SOLUCIÓN: Configurar Vercel Manualmente

## ❌ Problema Detectado

Vercel muestra error **404 DEPLOYMENT_NOT_FOUND** porque el proyecto aún no ha sido importado/configurado en Vercel.

---

## ✅ SOLUCIÓN: Configurar Vercel (5 minutos)

### Paso 1: Ir a Vercel Dashboard

1. Abre en tu navegador: **https://vercel.com/login**
2. Login con tu cuenta de GitHub
3. Autoriza a Vercel acceder a tus repositorios

### Paso 2: Importar el Proyecto

1. En Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Busca el repositorio: **`networkerpro20-oss/opentalk-wisp`**
3. Click **"Import"**

### Paso 3: Configurar el Proyecto

**IMPORTANTE**: Usa exactamente esta configuración:

```
Project Name: opentalk-wisp
Framework Preset: Next.js
Root Directory: apps/frontend  ← MUY IMPORTANTE
Build Command: pnpm build (auto-detectado)
Output Directory: .next (auto-detectado)
Install Command: pnpm install (auto-detectado)
Node.js Version: 18.x (recomendado)
```

### Paso 4: Variables de Entorno

Click en **"Environment Variables"** y agregar:

**Nombre**: `NEXT_PUBLIC_API_URL`  
**Valor**: `https://opentalk-backend.onrender.com`  
**Environments**: Production, Preview, Development (todos)

Click **"Add"**

### Paso 5: Deploy

1. Click **"Deploy"**
2. Vercel comenzará a buildear (2-3 minutos)
3. Verás el progreso en tiempo real

---

## 🎯 Configuración Visual Paso a Paso

### Pantalla de Importar
```
┌─────────────────────────────────────────┐
│ Import Git Repository                  │
├─────────────────────────────────────────┤
│                                         │
│ 🔍 Search: opentalk-wisp               │
│                                         │
│ Results:                                │
│ ✓ networkerpro20-oss/opentalk-wisp    │
│   [Import]  ← Click aquí               │
│                                         │
└─────────────────────────────────────────┘
```

### Pantalla de Configure Project
```
┌─────────────────────────────────────────┐
│ Configure Project                       │
├─────────────────────────────────────────┤
│                                         │
│ Project Name:                           │
│ [opentalk-wisp                     ]    │
│                                         │
│ Framework Preset:                       │
│ [Next.js                ▼]              │
│                                         │
│ Root Directory:                         │
│ [apps/frontend          ▼] ← IMPORTANTE│
│                                         │
│ Build and Output Settings:              │
│ Build Command:                          │
│ [pnpm build                        ]    │
│                                         │
│ Output Directory:                       │
│ [.next                             ]    │
│                                         │
│ Install Command:                        │
│ [pnpm install                      ]    │
│                                         │
│ Environment Variables:                  │
│ ┌───────────────────────────────────┐  │
│ │ NEXT_PUBLIC_API_URL               │  │
│ │ https://opentalk-backend...       │  │
│ └───────────────────────────────────┘  │
│                                         │
│                    [Deploy] ← Click aquí│
└─────────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE: Root Directory

**El error más común** es olvidar configurar **Root Directory: apps/frontend**

Si no lo configuras, Vercel buscará `package.json` en la raíz y fallará.

---

## 🔍 Verificar Después del Deploy

Una vez que el deploy termine (2-3 minutos):

1. Vercel te dará una URL: `https://opentalk-wisp-xxx.vercel.app`
2. Click en "Visit" para abrir
3. Deberías ver la página de login

**Si funciona**: ✅ Listo!  
**Si no funciona**: Ver logs en Vercel Dashboard → Deployments → Último deploy → Build Logs

---

## 🐛 Troubleshooting

### Error: "No package.json found"

**Causa**: Root Directory no está configurado

**Solución**:
1. Ve a Project Settings → General
2. Root Directory: `apps/frontend`
3. Save y Redeploy

### Error: "Build failed"

**Causa**: Falta `pnpm-lock.yaml` o dependencias

**Solución**:
1. Verifica que `pnpm-lock.yaml` esté en la raíz del repo
2. Verifica que `apps/frontend/package.json` exista
3. Redeploy

### Error: "Cannot find module @xyflow/react"

**Causa**: Dependencias no instaladas correctamente

**Solución**:
1. En Vercel, ve a Settings → General
2. Install Command: `pnpm install --no-frozen-lockfile`
3. Save y Redeploy

---

## 📊 Después de Configurar

Una vez configurado, los próximos deployments serán automáticos:

```
git push origin main
   ↓
GitHub recibe el push
   ↓
Vercel detecta cambios
   ↓
Auto-deploy en 2-3 minutos
   ↓
✅ Listo
```

---

## 🎯 URLs Finales

Después del primer deploy exitoso, tendrás:

**Production URL**: `https://opentalk-wisp.vercel.app`  
**Preview URLs**: Una por cada PR o branch

---

## ⏱️ Tiempo Estimado

- Configuración inicial: **5 minutos**
- Primer deploy: **2-3 minutos**
- **Total: ~8 minutos**

---

## ✅ Checklist

- [ ] 1. Login en Vercel con GitHub
- [ ] 2. Import proyecto opentalk-wisp
- [ ] 3. Configurar Root Directory: apps/frontend
- [ ] 4. Agregar variable: NEXT_PUBLIC_API_URL
- [ ] 5. Click Deploy
- [ ] 6. Esperar 2-3 minutos
- [ ] 7. Verificar que funcione

---

## 🔗 Links Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Monorepo Docs**: https://vercel.com/docs/monorepos

---

## 🆘 Si Sigues Teniendo Problemas

Comparte:
1. Screenshot del error en Vercel
2. Build logs (últimas 50 líneas)
3. Configuración del proyecto (Root Directory, etc.)

---

**🎯 ACCIÓN REQUERIDA**: Ve ahora a https://vercel.com/dashboard e importa el proyecto.
