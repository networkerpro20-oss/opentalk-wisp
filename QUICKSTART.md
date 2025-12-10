# 🚀 OpenTalkWisp - Quick Start Guide

## 📍 URLs Importantes

### 🌐 Aplicaciones
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:3000/api
- **API Docs (Swagger):** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/health
- **MailHog UI:** http://localhost:8025

### 🗄️ Base de Datos
- **PostgreSQL:** localhost:54320
- **Redis:** localhost:6380

---

## 🔑 Credenciales de Acceso

### Usuario Demo
```
Email: demo@opentalkwisp.com
Password: demo1234
Role: OWNER
Organization: Demo Organization
```

### PostgreSQL
```
Host: localhost
Port: 54320
Database: opentalkwisp
User: postgres
Password: postgres
```

### Redis
```
Host: localhost
Port: 6380
```

---

## 🎯 Comandos Rápidos

### Iniciar Todo el Proyecto
```bash
# 1. Iniciar servicios Docker
cd /home/easyaccess/projects/opentalk-wisp
docker-compose up -d

# 2. Verificar que los servicios estén corriendo
docker-compose ps

# 3. Iniciar Backend (en una terminal)
cd apps/backend
pnpm dev
# O en background:
nohup pnpm dev > backend.log 2>&1 &

# 4. Iniciar Frontend (en otra terminal)
cd apps/frontend
pnpm dev
# O en background:
nohup pnpm dev > frontend.log 2>&1 &
```

### Comandos Docker
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose stop

# Parar y eliminar (¡CUIDADO! Borra datos)
docker-compose down -v

# Verificar estado
docker-compose ps
```

### Comandos Base de Datos
```bash
cd apps/backend

# Generar cliente Prisma
pnpm prisma generate

# Crear migración
pnpm prisma migrate dev --name nombre_migracion

# Aplicar migraciones
pnpm prisma migrate deploy

# Ver datos (Prisma Studio)
pnpm prisma studio

# Ejecutar seed
pnpm prisma db seed
```

### Comandos de Desarrollo
```bash
# Instalar dependencias (desde root)
pnpm install

# Linting
pnpm lint

# Build todo el monorepo
pnpm build

# Ejecutar solo backend
pnpm --filter @opentalkwisp/backend dev

# Ejecutar solo frontend
pnpm --filter @opentalkwisp/frontend dev
```

---

## 🧪 Testing de API

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@opentalkwisp.com",
    "password": "demo1234"
  }' | jq
```

### Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "test1234",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org",
    "organizationSlug": "test-org"
  }' | jq
```

### Health Check
```bash
curl http://localhost:3000/api/health | jq
```

### Get Current User (con token)
```bash
# 1. Guardar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@opentalkwisp.com","password":"demo1234"}' \
  | jq -r '.token')

# 2. Usar token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me | jq
```

### Organization Stats
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/organizations/me/stats | jq
```

### List Users
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/users | jq
```

---

## 📂 Estructura del Proyecto

```
opentalk-wisp/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── organizations/
│   │   │   ├── users/
│   │   │   ├── prisma/
│   │   │   └── main.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   └── frontend/         # Next.js 14 App
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   └── dashboard/
│       │   ├── components/
│       │   ├── lib/
│       │   └── store/
│       └── package.json
├── docs/                 # Documentación
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 🐛 Troubleshooting

### Puerto en Uso
```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar proceso
lsof -ti:3000 | xargs kill -9
```

### Docker No Inicia
```bash
# Limpiar contenedores
docker-compose down -v
docker system prune -a

# Reiniciar Docker
sudo systemctl restart docker
```

### Error de Prisma
```bash
# Regenerar cliente
cd apps/backend
pnpm prisma generate

# Resetear base de datos (¡CUIDADO!)
pnpm prisma migrate reset
```

### Frontend No Compila
```bash
cd apps/frontend

# Limpiar cache
rm -rf .next node_modules

# Reinstalar
pnpm install

# Iniciar de nuevo
pnpm dev
```

### Backend No Conecta a DB
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de PostgreSQL
docker-compose logs postgres

# Verificar variables de entorno
cat .env
```

---

## 📊 Verificar Estado del Sistema

### Check All Services
```bash
# Backend
curl -s http://localhost:3000/api/health | jq

# Frontend
curl -s http://localhost:3002 | head -10

# PostgreSQL
docker exec -it opentalkwisp-postgres psql -U postgres -d opentalkwisp -c "SELECT COUNT(*) FROM \"Organization\";"

# Redis
docker exec -it opentalkwisp-redis redis-cli PING
```

### Ver Logs en Tiempo Real
```bash
# Backend (si se inició con nohup)
tail -f apps/backend/backend.log

# Frontend (si se inició con nohup)
tail -f apps/frontend/frontend.log

# Docker services
docker-compose logs -f
```

---

## 🎨 Acceder a la Aplicación

### Flujo Completo
1. **Abrir navegador:** http://localhost:3002
2. **Login:** Usar credenciales demo (demo@opentalkwisp.com / demo1234)
3. **Dashboard:** Ver estadísticas de la organización
4. **API Docs:** http://localhost:3000/api/docs para explorar endpoints

### Probar Registro
1. **Ir a:** http://localhost:3002/register
2. **Llenar formulario** con datos de nueva organización
3. **Submit** → Redirect automático a dashboard
4. **Ver datos** en la nueva organización

---

## 🔒 Seguridad

### Cambiar Secrets (Producción)
```bash
# En .env
JWT_SECRET=tu-secret-super-seguro-aqui-minimo-32-caracteres
DATABASE_URL=postgresql://usuario:password@host:puerto/database
```

### Rate Limiting
- Configurado en `main.ts`
- Default: 10 requests por minuto
- Cambiar en `ThrottlerModule.forRoot()`

---

## 📚 Recursos Adicionales

- **Documentación API:** http://localhost:3000/api/docs
- **Reporte Implementación:** `docs/REPORTE-IMPLEMENTACION-MVP.md`
- **Reporte Frontend:** `docs/REPORTE-MVP-FRONTEND-COMPLETADO.md`
- **Análisis Completo:** `docs/00-INDICE-GENERAL.md`

---

**¿Problemas?** Revisa los logs o contacta al equipo de desarrollo.
