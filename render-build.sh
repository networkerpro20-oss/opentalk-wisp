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

# Instalar dependencias del workspace
echo "📦 Instalando dependencias del workspace..."
pnpm install --frozen-lockfile --shamefully-hoist

# Ir al directorio del backend
cd apps/backend

echo "📦 Instalando dependencias del backend..."
pnpm install --shamefully-hoist

# Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate

# Build del backend (antes de migraciones para ahorrar memoria)
echo "🏗️  Building backend..."
pnpm build

# Ejecutar migraciones (después del build)
echo "🔧 Ejecutando migraciones de base de datos..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL no está configurado, las migraciones se ejecutarán en el start"
else
    echo "✅ DATABASE_URL configurado, ejecutando migraciones..."
    npx prisma migrate deploy || echo "⚠️  Migraciones fallarán, se reintentarán en el start"
fi

echo "✅ Build completado!"
