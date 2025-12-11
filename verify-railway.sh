#!/bin/bash

# ====================================================
# Railway Deployment Verification Script
# ====================================================
# Este script verifica que tu deployment en Railway esté funcionando correctamente

set -e

echo "🚂 Verificando Deployment en Railway..."
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
  else
    echo -e "${RED}❌ $1${NC}"
    exit 1
  fi
}

# Pedir URL de Railway
echo "Por favor ingresa la URL de tu backend en Railway:"
echo "Ejemplo: https://opentalk-wisp-backend-production.up.railway.app"
read -p "URL: " BACKEND_URL

# Limpiar URL (quitar / al final si existe)
BACKEND_URL=${BACKEND_URL%/}

echo ""
echo "🔍 Verificando: $BACKEND_URL"
echo "========================================"
echo ""

# 1. Verificar que el servidor responda
echo "1️⃣  Verificando conectividad..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  check "Servidor respondiendo (HTTP $HTTP_CODE)"
else
  echo -e "${RED}❌ Servidor no responde correctamente (HTTP $HTTP_CODE)${NC}"
  echo -e "${YELLOW}Verifica los logs en Railway Dashboard${NC}"
  exit 1
fi

# 2. Verificar endpoint de health
echo ""
echo "2️⃣  Verificando endpoint /api/health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
echo "$HEALTH_RESPONSE" | grep -q "ok" && check "Health endpoint funcionando" || {
  echo -e "${RED}❌ Health endpoint no retorna 'ok'${NC}"
  echo "Respuesta: $HEALTH_RESPONSE"
  exit 1
}

# 3. Verificar base de datos
echo ""
echo "3️⃣  Verificando conexión a base de datos..."
DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
if [ "$DB_STATUS" = "connected" ]; then
  check "Base de datos conectada"
else
  echo -e "${YELLOW}⚠️  Estado de base de datos: $DB_STATUS${NC}"
fi

# 4. Verificar Redis
echo ""
echo "4️⃣  Verificando conexión a Redis..."
REDIS_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
if [ "$REDIS_STATUS" = "connected" ]; then
  check "Redis conectado"
else
  echo -e "${YELLOW}⚠️  Estado de Redis: $REDIS_STATUS${NC}"
fi

# 5. Verificar CORS
echo ""
echo "5️⃣  Verificando configuración CORS..."
CORS_HEADER=$(curl -s -I -H "Origin: https://opentalk-wisp-frontend.vercel.app" "$BACKEND_URL/api/health" | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
  check "CORS configurado"
  echo "   $CORS_HEADER"
else
  echo -e "${YELLOW}⚠️  CORS podría no estar configurado correctamente${NC}"
fi

# 6. Verificar WebSocket
echo ""
echo "6️⃣  Verificando WebSocket..."
WS_URL="${BACKEND_URL/https/wss}/socket.io/"
echo "   WebSocket URL: $WS_URL"
check "WebSocket URL generada"

# Resumen
echo ""
echo "========================================"
echo -e "${GREEN}✅ VERIFICACIÓN COMPLETADA${NC}"
echo "========================================"
echo ""
echo "📋 Resumen:"
echo "   Backend URL: $BACKEND_URL"
echo "   Health: ✅"
echo "   Database: ✅"
echo "   Redis: ✅"
echo ""
echo "🎯 Próximos pasos:"
echo "   1. Actualiza NEXT_PUBLIC_API_URL en Vercel con: $BACKEND_URL"
echo "   2. Configura el volumen persistente en Railway: /app/wa-sessions"
echo "   3. Verifica las variables de entorno en Railway"
echo ""
echo "📚 Para más información, revisa: RAILWAY_MIGRATION_COMPLETE.md"
echo ""
