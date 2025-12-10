#!/bin/bash
set -e

echo "🚀 Iniciando OpenTalkWisp Backend..."

# Configurar límite de memoria
export NODE_OPTIONS="--max-old-space-size=460"

# Ejecutar migraciones de Prisma
echo "🔧 Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

echo "✅ Migraciones completadas"

# Iniciar el servidor
echo "🚀 Iniciando servidor NestJS..."
node dist/main.js
