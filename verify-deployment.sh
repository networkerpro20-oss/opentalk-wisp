#!/bin/bash

# 🔍 Script de Verificación Post-Deployment
# Verifica que todos los servicios estén funcionando correctamente

echo "🔍 VERIFICANDO DEPLOYMENT DE OPENTALK WISP"
echo "=========================================="
echo ""

# URLs
BACKEND_URL="https://opentalk-backend.onrender.com"
FRONTEND_URL="https://opentalk-wisp.vercel.app"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar endpoint
check_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Verificando $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    elif [ "$response" = "000" ]; then
        echo -e "${YELLOW}⏳ TIMEOUT${NC} (servicio iniciando o dormido)"
        return 1
    else
        echo -e "${RED}✗ ERROR${NC} (HTTP $response)"
        return 1
    fi
}

# 1. Backend Health Check
echo "1️⃣  Backend Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_endpoint "$BACKEND_URL/api/health" "Health Endpoint"

if [ $? -eq 0 ]; then
    # Mostrar respuesta detallada
    echo "   Respuesta:"
    curl -s "$BACKEND_URL/api/health" | python3 -m json.tool 2>/dev/null || echo "   (no JSON)"
fi

echo ""

# 2. Endpoints de Flows
echo "2️⃣  Flows API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_endpoint "$BACKEND_URL/api/flows" "GET /api/flows"
echo ""

# 3. Endpoints de IA
echo "3️⃣  AI API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_endpoint "$BACKEND_URL/api/ai/sentiment" "POST /api/ai/sentiment"
echo ""

# 4. Frontend
echo "4️⃣  Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_endpoint "$FRONTEND_URL" "Homepage"
check_endpoint "$FRONTEND_URL/login" "Login Page"
check_endpoint "$FRONTEND_URL/dashboard" "Dashboard"
echo ""

# 5. Verificar CORS
echo "5️⃣  CORS Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "Verificando CORS headers... "

cors_header=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/health" | grep -i "access-control-allow-origin")

if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓ OK${NC}"
    echo "   $cors_header"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (CORS header no encontrado)"
fi

echo ""

# 6. Database Connection
echo "6️⃣  Database Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
db_status=$(curl -s "$BACKEND_URL/api/health" | python3 -c "import sys, json; print(json.load(sys.stdin)['info']['database']['status'])" 2>/dev/null)

if [ "$db_status" = "up" ]; then
    echo -e "Database: ${GREEN}✓ CONNECTED${NC}"
else
    echo -e "Database: ${RED}✗ DISCONNECTED${NC}"
fi

echo ""

# Resumen
echo "=========================================="
echo "📊 RESUMEN"
echo "=========================================="
echo ""
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo -e "${YELLOW}ℹ️  Si ves TIMEOUT en Render (plan free), espera 30-60 segundos${NC}"
echo -e "${YELLOW}   El servicio se está 'despertando' automáticamente${NC}"
echo ""
echo "📚 Documentación:"
echo "   • DEPLOYMENT-STATUS-FLOWS.md"
echo "   • GUIA-SISTEMA-FLUJOS.md"
echo ""
echo "🔗 Monitoreo:"
echo "   • Vercel: https://vercel.com/dashboard"
echo "   • Render: https://dashboard.render.com"
echo ""
