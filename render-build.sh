#!/bin/bash
set -e  # Exit on error

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

# Ejecutar migraciones
echo "🔧 Ejecutando migraciones..."
npx prisma migrate deploy

# Build del backend
echo "🏗️  Building backend..."
pnpm build

echo "✅ Build completado!"
