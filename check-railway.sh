#!/bin/bash

# ====================================================
# Railway Configuration Checker
# Verifica que todas las variables estén configuradas
# ====================================================

echo "🔍 Verificando configuración de Railway para OpenTalkWisp..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

RAILWAY_URL="${1:-}"

if [ -z "$RAILWAY_URL" ]; then
  echo -e "${YELLOW}⚠️  Uso: ./check-railway.sh https://tu-backend.railway.app${NC}"
  echo ""
  echo "Ejemplo:"
  echo "  ./check-railway.sh https://opentalk-wisp-backend-production.up.railway.app"
  echo ""
  exit 1
fi

# Remove trailing slash if present
RAILWAY_URL="${RAILWAY_URL%/}"

echo "🌐 URL del Backend: $RAILWAY_URL"
echo ""

# ============================================
# 1. Verificar que el servicio esté activo
# ============================================
echo "1️⃣  Verificando que el servicio esté activo..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/health/simple" 2>&1)

if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ Servicio activo y respondiendo${NC}"
else
  echo -e "${RED}❌ Servicio no responde (HTTP $HEALTH_RESPONSE)${NC}"
  echo "   Verifica que el servicio esté deployed en Railway"
  exit 1
fi

echo ""

# ============================================
# 2. Verificar Base de Datos
# ============================================
echo "2️⃣  Verificando conexión a Base de Datos..."
DB_CHECK=$(curl -s "$RAILWAY_URL/api/health" 2>&1)

if echo "$DB_CHECK" | grep -q '"database":{"status":"up"}'; then
  echo -e "${GREEN}✅ PostgreSQL conectada correctamente${NC}"
else
  echo -e "${RED}❌ Error de conexión a PostgreSQL${NC}"
  echo "   Verifica que DATABASE_URL esté configurada en Railway"
  echo "   Debe ser: DATABASE_URL=\${{Postgres.DATABASE_URL}}"
fi

echo ""

# ============================================
# 3. Verificar Redis
# ============================================
echo "3️⃣  Verificando conexión a Redis..."

if echo "$DB_CHECK" | grep -q '"redis":{"status":"up"}'; then
  echo -e "${GREEN}✅ Redis conectado correctamente${NC}"
else
  echo -e "${YELLOW}⚠️  Redis no conectado (opcional pero recomendado)${NC}"
  echo "   Para habilitar, configura en Railway:"
  echo "   REDIS_URL=\${{Redis.REDIS_URL}}"
fi

echo ""

# ============================================
# 4. Verificar endpoints de autenticación
# ============================================
echo "4️⃣  Verificando endpoints de autenticación..."

# Test register endpoint (should return 400 for empty body, not 404)
REGISTER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RAILWAY_URL/api/auth/register" -H "Content-Type: application/json" -d '{}' 2>&1)

if [ "$REGISTER_RESPONSE" = "400" ] || [ "$REGISTER_RESPONSE" = "409" ]; then
  echo -e "${GREEN}✅ Endpoint /api/auth/register disponible${NC}"
elif [ "$REGISTER_RESPONSE" = "404" ]; then
  echo -e "${RED}❌ Endpoint /api/auth/register no encontrado${NC}"
  echo "   Posible problema con el routing o deployment"
else
  echo -e "${YELLOW}⚠️  Respuesta inesperada del endpoint de registro (HTTP $REGISTER_RESPONSE)${NC}"
fi

# Test login endpoint
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RAILWAY_URL/api/auth/login" -H "Content-Type: application/json" -d '{}' 2>&1)

if [ "$LOGIN_RESPONSE" = "400" ] || [ "$LOGIN_RESPONSE" = "401" ]; then
  echo -e "${GREEN}✅ Endpoint /api/auth/login disponible${NC}"
elif [ "$LOGIN_RESPONSE" = "404" ]; then
  echo -e "${RED}❌ Endpoint /api/auth/login no encontrado${NC}"
else
  echo -e "${YELLOW}⚠️  Respuesta inesperada del endpoint de login (HTTP $LOGIN_RESPONSE)${NC}"
fi

echo ""

# ============================================
# 5. Verificar CORS
# ============================================
echo "5️⃣  Verificando configuración de CORS..."

# Make a request with Origin header to test CORS
CORS_RESPONSE=$(curl -s -X OPTIONS "$RAILWAY_URL/api/auth/login" \
  -H "Origin: https://test.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i 2>&1)

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ CORS configurado correctamente${NC}"
  echo "   Vercel domains (*.vercel.app) están permitidos"
else
  echo -e "${YELLOW}⚠️  No se pudo verificar CORS${NC}"
  echo "   Asegúrate de que FRONTEND_URL esté configurada"
fi

echo ""

# ============================================
# 6. Test de registro real
# ============================================
echo "6️⃣  Probando registro de usuario de prueba..."

RANDOM_EMAIL="test-$(date +%s)@example.com"

REGISTER_TEST=$(curl -s -X POST "$RAILWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"Test123456!\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"organizationName\": \"Test Org\"
  }" 2>&1)

if echo "$REGISTER_TEST" | grep -q "token"; then
  echo -e "${GREEN}✅ Registro de usuario funciona correctamente${NC}"
  echo -e "${GREEN}   Base de datos está activa y aceptando registros${NC}"
elif echo "$REGISTER_TEST" | grep -q "already exists"; then
  echo -e "${GREEN}✅ Endpoint de registro funciona (email ya existe)${NC}"
elif echo "$REGISTER_TEST" | grep -q "error"; then
  echo -e "${RED}❌ Error al registrar usuario${NC}"
  echo "   Respuesta: $REGISTER_TEST"
else
  echo -e "${YELLOW}⚠️  Respuesta inesperada del registro${NC}"
  echo "   Respuesta: $REGISTER_TEST"
fi

echo ""
echo "============================================"
echo "📋 RESUMEN"
echo "============================================"
echo ""

# Count checks
TOTAL_CHECKS=6
PASSED_CHECKS=0

# Re-verify each check
[ "$HEALTH_RESPONSE" = "200" ] && ((PASSED_CHECKS++))
echo "$DB_CHECK" | grep -q '"database":{"status":"up"}' && ((PASSED_CHECKS++))
echo "$DB_CHECK" | grep -q '"redis":{"status":"up"}' && ((PASSED_CHECKS++))
[ "$REGISTER_RESPONSE" = "400" ] || [ "$REGISTER_RESPONSE" = "409" ] && ((PASSED_CHECKS++))
[ "$LOGIN_RESPONSE" = "400" ] || [ "$LOGIN_RESPONSE" = "401" ] && ((PASSED_CHECKS++))
echo "$REGISTER_TEST" | grep -q "token\|already exists" && ((PASSED_CHECKS++))

echo "Checks pasados: $PASSED_CHECKS / $TOTAL_CHECKS"
echo ""

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
  echo -e "${GREEN}🎉 ¡Todo está configurado correctamente!${NC}"
  echo ""
  echo "Próximos pasos:"
  echo "1. Configura NEXT_PUBLIC_API_URL=$RAILWAY_URL en Vercel"
  echo "2. Redeploy el frontend"
  echo "3. ¡Prueba el registro desde la interfaz web!"
elif [ $PASSED_CHECKS -ge 4 ]; then
  echo -e "${YELLOW}⚠️  Configuración parcial - revisa los warnings arriba${NC}"
  echo ""
  echo "Revisa:"
  echo "- Variables de entorno en Railway Dashboard"
  echo "- Logs de Railway para errores"
  echo "- Documento RAILWAY_CONFIG.md para ayuda"
else
  echo -e "${RED}❌ Problemas significativos detectados${NC}"
  echo ""
  echo "Acciones recomendadas:"
  echo "1. Revisa logs de Railway"
  echo "2. Verifica todas las variables de entorno"
  echo "3. Consulta RAILWAY_CONFIG.md"
  echo "4. Verifica que las migraciones se ejecutaron"
fi

echo ""
