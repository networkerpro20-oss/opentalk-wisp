#!/bin/bash
set -e

echo "🚀 OpenTalkWisp Backend - Iniciando en producción..."

# Configurar límite de memoria
export NODE_OPTIONS="--max-old-space-size=460"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json"
    echo "📁 Directorio actual: $(pwd)"
    exit 1
fi

echo "✅ Directorio correcto: $(pwd)"

# Verificar que DATABASE_URL existe
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR CRÍTICO: DATABASE_URL no está configurada"
    exit 1
fi

echo "✅ DATABASE_URL configurada"

# Ejecutar migraciones de Prisma usando el binario directo
echo "🔧 Ejecutando migraciones de base de datos..."
../../node_modules/.bin/prisma migrate deploy

echo "✅ Migraciones completadas exitosamente"

# Verificar que el build existe
if [ ! -d "dist" ]; then
    echo "❌ Error: No se encuentra el directorio dist/"
    exit 1
fi

echo "✅ Build encontrado"

# Iniciar el servidor
echo "🚀 Iniciando servidor NestJS en puerto ${PORT:-10000}..."
exec node dist/main.js
