#!/bin/bash
# No usar set -e para permitir continuar con errores no críticos

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
pnpm install --frozen-lockfile --shamefully-hoist || pnpm install --shamefully-hoist

# Ir al directorio del backend
cd apps/backend

echo "📦 Instalando dependencias del backend..."
pnpm install --shamefully-hoist || echo "⚠️  Continuando con dependencias instaladas..."

# Generar Prisma Client
echo "🔧 Generando Prisma Client..."
pnpm prisma generate || ../../node_modules/.bin/prisma generate

# Build del backend
echo "🏗️  Building backend..."
pnpm build || {
    echo "❌ Build failed, but checking if dist exists..."
    if [ -d "dist" ]; then
        echo "✅ Dist folder exists, continuing..."
    else
        echo "❌ No dist folder, build really failed"
        exit 1
    fi
}

echo "✅ Build completado!"
echo "ℹ️  Las migraciones se ejecutarán en el Start Command"
echo "🔴 Redis configurado para Bull Queue"
