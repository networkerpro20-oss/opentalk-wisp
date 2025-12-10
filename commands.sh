#!/bin/bash

# OpenTalk Wisp - Comandos Rápidos
# ===================================

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   OpenTalk Wisp - Quick Commands      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Función para mostrar comandos
show_commands() {
    echo -e "${GREEN}📦 SETUP INICIAL${NC}"
    echo "  pnpm install                      # Instalar dependencias"
    echo "  cd apps/backend && pnpm prisma generate  # Generar Prisma client"
    echo "  pnpm prisma migrate dev           # Ejecutar migraciones"
    echo ""
    
    echo -e "${GREEN}🚀 DESARROLLO${NC}"
    echo "  pnpm dev                          # Iniciar todo (backend + frontend)"
    echo "  pnpm dev:backend                  # Solo backend (puerto 3001)"
    echo "  pnpm dev:frontend                 # Solo frontend (puerto 3000)"
    echo ""
    
    echo -e "${GREEN}🔨 BUILD${NC}"
    echo "  pnpm build                        # Build todo"
    echo "  pnpm build:backend                # Build backend"
    echo "  pnpm build:frontend               # Build frontend"
    echo ""
    
    echo -e "${GREEN}🗄️  DATABASE${NC}"
    echo "  cd apps/backend"
    echo "  pnpm prisma studio                # Abrir Prisma Studio (GUI)"
    echo "  pnpm prisma migrate dev --name <name>  # Crear migración"
    echo "  pnpm prisma migrate deploy        # Aplicar en producción"
    echo "  pnpm prisma generate              # Regenerar cliente"
    echo "  pnpm prisma db push               # Push schema sin migración"
    echo ""
    
    echo -e "${GREEN}🚢 DEPLOYMENT${NC}"
    echo "  ./deploy.sh                       # Script interactivo de deployment"
    echo "  docker-compose up -d              # Iniciar con Docker"
    echo "  docker-compose down               # Detener Docker"
    echo "  docker-compose logs -f            # Ver logs Docker"
    echo ""
    
    echo -e "${GREEN}🔍 DEBUGGING${NC}"
    echo "  # Ver logs backend"
    echo "  cd apps/backend && pnpm start:dev"
    echo "  "
    echo "  # Ver logs frontend"
    echo "  cd apps/frontend && pnpm dev"
    echo "  "
    echo "  # Limpiar todo y reinstalar"
    echo "  rm -rf node_modules apps/*/node_modules .next dist"
    echo "  pnpm install"
    echo ""
    
    echo -e "${GREEN}🧪 TESTING${NC}"
    echo "  pnpm test                         # Ejecutar tests"
    echo "  pnpm test:watch                   # Tests en modo watch"
    echo "  pnpm test:e2e                     # Tests end-to-end"
    echo ""
    
    echo -e "${GREEN}📚 DOCUMENTACIÓN${NC}"
    echo "  cat NEXT_STEPS.md                 # Próximos pasos"
    echo "  cat SETUP_COMPLETE.md             # Setup completo"
    echo "  cat DEPLOYMENT.md                 # Guía de deployment"
    echo "  cat QUICK_START_PRODUCTION.md     # Railway quick start"
    echo "  cat UI_IMPROVEMENTS.md            # Plan de mejoras UI"
    echo ""
    
    echo -e "${GREEN}🌐 URLs ÚTILES${NC}"
    echo "  http://localhost:3000             # Frontend"
    echo "  http://localhost:3001             # Backend API"
    echo "  http://localhost:3001/api         # Swagger Docs"
    echo "  http://localhost:5555             # Prisma Studio"
    echo ""
    
    echo -e "${GREEN}🔐 SEGURIDAD${NC}"
    echo "  # Generar JWT secret seguro"
    echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo ""
    echo "  # Generar password hash"
    echo "  node -e \"console.log(require('bcrypt').hashSync('password', 10))\""
    echo ""
    
    echo -e "${GREEN}📦 PRODUCCIÓN${NC}"
    echo "  # Opción 1: Railway (más fácil)"
    echo "  cat QUICK_START_PRODUCTION.md"
    echo "  "
    echo "  # Opción 2: Docker"
    echo "  ./deploy.sh"
    echo "  "
    echo "  # Opción 3: VPS"
    echo "  cat DEPLOYMENT.md"
    echo ""
    
    echo -e "${YELLOW}💡 TIPS:${NC}"
    echo "  • Ejecuta 'pnpm prisma generate' después de cambios en schema.prisma"
    echo "  • Usa 'pnpm prisma studio' para explorar la base de datos"
    echo "  • Los logs están en Railway Dashboard o docker-compose logs"
    echo "  • Para producción, usa variables de entorno desde .env"
    echo "  • Railway auto-despliega en cada push a main"
    echo ""
}

# Función para quick start
quick_start() {
    echo -e "${BLUE}🚀 Quick Start - Primeros Pasos${NC}"
    echo ""
    echo "1️⃣  Instalar dependencias:"
    echo "    pnpm install"
    echo ""
    echo "2️⃣  Configurar base de datos:"
    echo "    cd apps/backend"
    echo "    cp .env.example .env"
    echo "    # Editar .env con tu DATABASE_URL"
    echo "    pnpm prisma generate"
    echo "    pnpm prisma migrate dev"
    echo ""
    echo "3️⃣  Iniciar desarrollo:"
    echo "    cd ../.."
    echo "    pnpm dev"
    echo ""
    echo "4️⃣  Abrir en el navegador:"
    echo "    http://localhost:3000"
    echo ""
    echo "5️⃣  Registrar usuario y probar!"
    echo ""
}

# Función para troubleshooting
troubleshooting() {
    echo -e "${YELLOW}🔧 Troubleshooting${NC}"
    echo ""
    echo "❌ Error: Cannot find module '@prisma/client'"
    echo "   ✅ Solución: cd apps/backend && pnpm prisma generate"
    echo ""
    echo "❌ Error: Connection refused (API calls)"
    echo "   ✅ Solución: Verificar que backend esté en puerto 3001"
    echo "   ✅ Revisar NEXT_PUBLIC_API_URL en frontend/.env.local"
    echo ""
    echo "❌ Error: WhatsApp no conecta"
    echo "   ✅ QR expira en 60s, recargar página"
    echo "   ✅ Solo una instancia por número"
    echo "   ✅ Ver logs del backend"
    echo ""
    echo "❌ Error: CORS blocked"
    echo "   ✅ Agregar tu URL en apps/backend/src/main.ts"
    echo "   ✅ Verificar FRONTEND_URL en backend"
    echo ""
    echo "❌ Build falla"
    echo "   ✅ Limpiar: rm -rf node_modules dist .next"
    echo "   ✅ Reinstalar: pnpm install"
    echo "   ✅ Regenerar: pnpm prisma generate"
    echo ""
}

# Menú principal
while true; do
    echo ""
    echo -e "${BLUE}Selecciona una opción:${NC}"
    echo "1) Ver todos los comandos"
    echo "2) Quick Start (primeros pasos)"
    echo "3) Troubleshooting"
    echo "4) Salir"
    echo ""
    read -p "Opción [1-4]: " option
    
    case $option in
        1)
            show_commands
            ;;
        2)
            quick_start
            ;;
        3)
            troubleshooting
            ;;
        4)
            echo -e "${GREEN}¡Hasta luego! 👋${NC}"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Opción inválida${NC}"
            ;;
    esac
    
    read -p "Presiona Enter para continuar..."
done
