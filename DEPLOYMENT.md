# 🚀 Guía de Deployment a Producción

## Opciones de Deployment

### Opción 1: Railway (Recomendado - Más Fácil) 🌟

**¿Por qué Railway?**
- ✅ Deploy automático desde GitHub
- ✅ PostgreSQL incluido gratis
- ✅ SSL/HTTPS automático
- ✅ $5/mes por servicio
- ✅ Variables de entorno fáciles de configurar

#### Pasos para Railway:

1. **Crear cuenta en Railway**
   ```
   https://railway.app
   ```

2. **Conectar tu repositorio GitHub**
   - Push tu código a GitHub
   - En Railway: "New Project" → "Deploy from GitHub"
   - Selecciona el repo `opentalk-wisp`

3. **Configurar Backend**
   ```bash
   # Railway detectará automáticamente el backend
   # Configurar variables de entorno en Railway:
   ```
   
   Variables necesarias:
   ```env
   DATABASE_URL=postgresql://... (Railway lo genera automáticamente)
   JWT_SECRET=genera-un-secret-seguro-aqui-32-caracteres-minimo
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://tu-frontend.railway.app
   ```

4. **Configurar Frontend**
   ```bash
   # Agregar nuevo servicio en Railway
   # Variables de entorno:
   ```
   
   ```env
   NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
   ```

5. **Ejecutar migraciones**
   ```bash
   # En Railway, ir a backend → Settings → Deploy → Add command
   # Build Command: pnpm prisma generate && pnpm build
   # Start Command: pnpm prisma migrate deploy && pnpm start:prod
   ```

**Costo estimado: $10-15/mes**

---

### Opción 2: Vercel + Supabase (Frontend optimizado) ⚡

**¿Por qué esta opción?**
- ✅ Vercel es el mejor para Next.js (gratuito)
- ✅ Supabase tiene PostgreSQL gratis
- ✅ Deploy automático en cada push
- ✅ CDN global incluido

#### Pasos:

1. **Deploy Backend en Railway o Render**
   - Sigue pasos de Railway arriba solo para backend
   - O usa Render.com (similar a Railway)

2. **Base de datos en Supabase**
   ```
   https://supabase.com
   ```
   - Crear proyecto
   - Copiar connection string de PostgreSQL
   - Usar esa URL en el backend

3. **Deploy Frontend en Vercel**
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Desde /apps/frontend
   cd apps/frontend
   vercel
   ```
   
   - Conectar con GitHub
   - Configurar variables de entorno:
     ```env
     NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
     ```

**Costo estimado: $5-10/mes (solo backend)**

---

### Opción 3: VPS (Máximo control) 🖥️

**¿Por qué VPS?**
- ✅ Control total
- ✅ Más barato a largo plazo
- ✅ Recursos dedicados

Proveedores recomendados:
- **DigitalOcean** - $6/mes (1GB RAM)
- **Hetzner** - $4.50/mes (2GB RAM) 
- **Linode** - $5/mes (1GB RAM)
- **Contabo** - $5/mes (4GB RAM)

#### Pasos para VPS:

1. **Crear VPS con Ubuntu 22.04**

2. **Conectar por SSH**
   ```bash
   ssh root@tu-ip-del-vps
   ```

3. **Instalar dependencias**
   ```bash
   # Actualizar sistema
   apt update && apt upgrade -y
   
   # Instalar Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   
   # Instalar pnpm
   npm install -g pnpm
   
   # Instalar PostgreSQL
   apt install -y postgresql postgresql-contrib
   
   # Instalar Nginx (para proxy reverso)
   apt install -y nginx
   
   # Instalar PM2 (para mantener apps corriendo)
   npm install -g pm2
   
   # Instalar Certbot (para SSL gratis)
   apt install -y certbot python3-certbot-nginx
   ```

4. **Configurar PostgreSQL**
   ```bash
   sudo -u postgres psql
   
   # Dentro de PostgreSQL:
   CREATE DATABASE opentalk_wisp;
   CREATE USER opentalk WITH PASSWORD 'tu-password-segura';
   GRANT ALL PRIVILEGES ON DATABASE opentalk_wisp TO opentalk;
   \q
   ```

5. **Clonar repositorio**
   ```bash
   cd /var/www
   git clone https://github.com/tu-usuario/opentalk-wisp.git
   cd opentalk-wisp
   pnpm install
   ```

6. **Configurar variables de entorno**
   ```bash
   # Backend
   cd apps/backend
   nano .env
   ```
   
   Contenido:
   ```env
   DATABASE_URL="postgresql://opentalk:tu-password-segura@localhost:5432/opentalk_wisp"
   JWT_SECRET="genera-un-secret-muy-seguro-aqui-minimo-32-caracteres"
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://tu-dominio.com
   ```
   
   ```bash
   # Frontend
   cd ../frontend
   nano .env.local
   ```
   
   Contenido:
   ```env
   NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
   ```

7. **Ejecutar migraciones y build**
   ```bash
   # Backend
   cd /var/www/opentalk-wisp/apps/backend
   pnpm prisma generate
   pnpm prisma migrate deploy
   pnpm build
   
   # Frontend
   cd ../frontend
   pnpm build
   ```

8. **Configurar PM2**
   ```bash
   # Backend
   cd /var/www/opentalk-wisp/apps/backend
   pm2 start dist/main.js --name opentalk-backend
   
   # Frontend
   cd ../frontend
   pm2 start npm --name opentalk-frontend -- start
   
   # Guardar configuración PM2
   pm2 save
   pm2 startup
   ```

9. **Configurar Nginx**
   ```bash
   nano /etc/nginx/sites-available/opentalk
   ```
   
   Contenido:
   ```nginx
   # Backend API
   server {
       listen 80;
       server_name api.tu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   
   # Frontend
   server {
       listen 80;
       server_name tu-dominio.com www.tu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   # Activar configuración
   ln -s /etc/nginx/sites-available/opentalk /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

10. **Configurar SSL con Let's Encrypt (GRATIS)**
    ```bash
    # Para backend
    certbot --nginx -d api.tu-dominio.com
    
    # Para frontend
    certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
    ```

11. **Configurar Firewall**
    ```bash
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw enable
    ```

**Costo estimado: $5-10/mes**

---

## Configuración de Dominio

### Si tienes un dominio:

1. **Apuntar DNS a tu servidor**
   
   En tu proveedor de dominio (Namecheap, GoDaddy, etc.):
   
   ```
   Tipo A:
   @ (root)           → IP-del-servidor
   www                → IP-del-servidor
   api                → IP-del-servidor
   ```

2. **Esperar propagación DNS** (5-30 minutos)

### Si NO tienes dominio:

Opciones gratuitas:
- **Freenom** - Dominios .tk, .ml, .ga gratis
- **DuckDNS** - Subdominios gratis (miapp.duckdns.org)
- Usar IP directa temporalmente

O comprar dominio:
- **Namecheap** - $8-12/año
- **Porkbun** - $3-10/año
- **Cloudflare** - $10/año

---

## Checklist Pre-Production ✅

Antes de hacer deploy, asegúrate de:

```bash
# 1. Variables de entorno configuradas
[ ] DATABASE_URL
[ ] JWT_SECRET (mínimo 32 caracteres aleatorios)
[ ] NODE_ENV=production
[ ] FRONTEND_URL
[ ] NEXT_PUBLIC_API_URL

# 2. Seguridad
[ ] Cambiar todos los passwords por defecto
[ ] JWT_SECRET único y seguro
[ ] Habilitar CORS solo para tu dominio
[ ] PostgreSQL no accesible públicamente
[ ] Firewall configurado

# 3. Base de datos
[ ] Backups automáticos configurados
[ ] Migraciones ejecutadas
[ ] Seed de datos inicial (si aplica)

# 4. Monitoreo (opcional pero recomendado)
[ ] Logs configurados
[ ] Alerts de errores (Sentry)
[ ] Uptime monitoring (UptimeRobot gratis)

# 5. Performance
[ ] Frontend en modo producción (next build)
[ ] Backend compilado (nest build)
[ ] Compresión gzip habilitada
[ ] Cache configurado
```

---

## Archivos de Configuración para Production

### 1. `.dockerignore` (si usas Docker)
```
node_modules
.git
.env
*.log
dist
.next
```

### 2. `ecosystem.config.js` (para PM2)
```javascript
module.exports = {
  apps: [
    {
      name: 'opentalk-backend',
      script: 'dist/main.js',
      cwd: '/var/www/opentalk-wisp/apps/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'opentalk-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/opentalk-wisp/apps/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

### 3. `docker-compose.yml` (alternativa completa)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: opentalk_wisp
      POSTGRES_USER: opentalk
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://opentalk:${DB_PASSWORD}@postgres:5432/opentalk_wisp
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## Comandos Útiles Post-Deploy

```bash
# Ver logs en tiempo real (PM2)
pm2 logs

# Reiniciar servicios
pm2 restart all

# Ver status
pm2 status

# Monitoreo
pm2 monit

# Backup de base de datos
pg_dump -U opentalk opentalk_wisp > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U opentalk opentalk_wisp < backup_20231210.sql

# Ver logs de Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Renovar certificado SSL (automático, pero por si acaso)
certbot renew
```

---

## Monitoreo y Mantenimiento

### Herramientas gratuitas recomendadas:

1. **UptimeRobot** (uptime monitoring)
   - Revisa cada 5 minutos si tu sitio está up
   - Alertas por email/SMS
   - 100% gratis

2. **Sentry** (error tracking)
   - Captura errores en producción
   - Stack traces completos
   - 5000 eventos/mes gratis

3. **PM2 Plus** (monitoring avanzado)
   - Monitoreo de memoria/CPU
   - Logs centralizados
   - Gratis para 1 servidor

---

## Costos Estimados

| Opción | Hosting | DB | Dominio | SSL | Total/mes |
|--------|---------|-----|---------|-----|-----------|
| Railway | $10 | Incluido | $1 | Gratis | **$11** |
| Vercel + Supabase | Gratis | Gratis | $1 | Gratis | **$1** |
| VPS | $5 | Incluido | $1 | Gratis | **$6** |

---

## Recomendación Final 🎯

**Para empezar rápido**: Railway (todo en un lugar)  
**Para presupuesto mínimo**: Vercel + Supabase  
**Para escalabilidad**: VPS propio  

**Mi recomendación**: Empieza con Railway, es la forma más rápida de tener todo funcionando en producción en menos de 30 minutos.

---

## Siguiente Paso

Una vez deployed, continúa con:
1. ✅ Testing en producción
2. ✅ Mejoras de UI/UX (ver UI_IMPROVEMENTS.md)
3. ✅ Feedback de usuarios
4. ✅ Iteración rápida
