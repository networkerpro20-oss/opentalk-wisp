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

# Generar Prisma Client (usando el binario directo del proyecto)
echo "🔧 Generando Prisma Client..."
../../node_modules/.bin/prisma generate

# Build del backend
echo "🏗️  Building backend..."
pnpm build

echo "✅ Build completado!"
echo "ℹ️  Las migraciones se ejecutarán en el Start Command"
echo "🔴 Redis configurado para Bull Queue"
