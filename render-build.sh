#!/bin/bash
set -e  # Exit on error

# Configurar variables de memoria para Node.js
export NODE_OPTIONS="--max-old-space-size=460"

# Build script para Render
echo "🚀 Iniciando build para Render..."

# Instalar pnpm si no existe
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm@8.15.0
fi

# Instalar dependencias del workspace (CON dev dependencies para build)
echo "📦 Instalando dependencias del workspace..."
pnpm install --frozen-lockfile --shamefully-hoist

# Ir al directorio del backend
cd apps/backend

echo "📦 Instalando dependencias del backend..."
pnpm install --shamefully-hoist

# Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate

# Verificar que DATABASE_URL existe
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurado"
    exit 1
fi

echo "✅ DATABASE_URL configurado correctamente"

# Ejecutar migraciones
echo "🔧 Ejecutando migraciones..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Verificar que las tablas se crearon
echo "🔍 Verificando tablas creadas..."
npx prisma db execute --stdin <<SQL
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
SQL

# Build del backend
echo "🏗️  Building backend..."
pnpm build

echo "✅ Build completado!"
