#!/bin/bash

# ====================================================
# Railway Setup Helper Script
# ====================================================
# Este script te ayuda a preparar todo para Railway

set -e

echo "🚂 Railway Setup Helper"
echo "======================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Generar JWT Secret
echo -e "${BLUE}1. Generando JWT_SECRET seguro...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✅ JWT_SECRET generado:${NC}"
echo ""
echo "   $JWT_SECRET"
echo ""
echo "   Copia este valor y úsalo en Railway como JWT_SECRET"
echo ""

# 2. Verificar archivos necesarios
echo -e "${BLUE}2. Verificando archivos necesarios...${NC}"

FILES=(
  "railway.json"
  "nixpacks.toml"
  ".env.railway.example"
  "apps/backend/package.json"
  "apps/backend/prisma/schema.prisma"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${YELLOW}⚠️${NC}  $file no encontrado"
  fi
done

echo ""

# 3. Mostrar template de variables
echo -e "${BLUE}3. Variables de entorno para Railway:${NC}"
echo ""
echo "Copia estas variables en Railway Dashboard → Variables:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << EOF
RAILWAY_ENVIRONMENT=production
NODE_ENV=production
PORT=3000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
API_PREFIX=/api
FRONTEND_URL=https://tu-frontend.vercel.app
CORS_ORIGIN=https://tu-frontend.vercel.app
DATABASE_URL=\${{Postgres.DATABASE_URL}}
REDIS_URL=\${{Redis.REDIS_URL}}
REDIS_HOST=\${{Redis.REDIS_HOST}}
REDIS_PORT=\${{Redis.REDIS_PORT}}
EOF
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 4. Checklist
echo -e "${BLUE}4. Checklist de deployment:${NC}"
echo ""
echo "Antes de hacer deploy en Railway, asegúrate de:"
echo ""
echo "  [ ] Crear PostgreSQL database en Railway"
echo "  [ ] Crear Redis en Railway"
echo "  [ ] Configurar las variables de entorno de arriba"
echo "  [ ] Crear volumen persistente: /app/wa-sessions"
echo "  [ ] Reemplazar FRONTEND_URL con tu URL de Vercel"
echo "  [ ] Generar domain en Railway"
echo "  [ ] Actualizar NEXT_PUBLIC_API_URL en Vercel"
echo ""

# 5. Próximos pasos
echo -e "${BLUE}5. Próximos pasos:${NC}"
echo ""
echo "  1. Ve a Railway Dashboard: https://railway.app/dashboard"
echo "  2. Crea un nuevo proyecto"
echo "  3. Agrega PostgreSQL y Redis"
echo "  4. Conecta tu repositorio de GitHub"
echo "  5. Pega las variables de entorno"
echo "  6. Crea el volumen persistente"
echo "  7. Deploy automático comenzará"
echo ""
echo -e "${GREEN}Para más detalles, revisa: RAILWAY_QUICK_START.md${NC}"
echo ""

# 6. Guardar en archivo (opcional)
read -p "¿Guardar estas variables en un archivo .env.railway? (s/n): " SAVE

if [ "$SAVE" = "s" ] || [ "$SAVE" = "S" ]; then
  cat > .env.railway << EOF
# Railway Environment Variables
# ⚠️ NO COMMITEAR ESTE ARCHIVO - Ya está en .gitignore

RAILWAY_ENVIRONMENT=production
NODE_ENV=production
PORT=3000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
API_PREFIX=/api

# ⚠️ REEMPLAZAR CON TU URL DE VERCEL
FRONTEND_URL=https://tu-frontend.vercel.app
CORS_ORIGIN=https://tu-frontend.vercel.app

# Railway auto-generated (usar referencias en Railway)
DATABASE_URL=\${{Postgres.DATABASE_URL}}
REDIS_URL=\${{Redis.REDIS_URL}}
REDIS_HOST=\${{Redis.REDIS_HOST}}
REDIS_PORT=\${{Redis.REDIS_PORT}}
EOF
  
  echo -e "${GREEN}✅ Guardado en .env.railway${NC}"
  echo "   (Este archivo está en .gitignore y no se commiteará)"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Helper completado${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
