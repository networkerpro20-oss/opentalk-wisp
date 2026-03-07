#!/bin/bash
set -e

echo "=== OpenTalk-Wisp VPS Deploy ==="

# Check .env.production exists
if [ ! -f .env.production ]; then
    echo "ERROR: .env.production not found."
    echo "Copy the template and fill in your values:"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Load env
set -a
source .env.production
set +a

# Validate required vars
if [ "$DB_PASSWORD" = "CHANGE_ME_STRONG_PASSWORD" ] || [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: Set a real DB_PASSWORD in .env.production"
    exit 1
fi

if [ "$JWT_SECRET" = "CHANGE_ME_GENERATE_WITH_OPENSSL" ] || [ -z "$JWT_SECRET" ]; then
    echo "ERROR: Set a real JWT_SECRET in .env.production"
    echo "Generate one with: openssl rand -hex 32"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    echo "Install with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo "1/4 Building containers..."
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo "2/4 Starting database and redis..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres redis
echo "Waiting for services to be healthy..."
sleep 10

echo "3/4 Starting backend, frontend, and nginx..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "4/4 Checking health..."
sleep 15
if curl -sf http://localhost/api/health/simple > /dev/null 2>&1; then
    echo "Backend: OK"
else
    echo "Backend: WAITING (check logs: docker logs opentalkwisp-backend)"
fi

if curl -sf http://localhost > /dev/null 2>&1; then
    echo "Frontend: OK"
else
    echo "Frontend: WAITING (check logs: docker logs opentalkwisp-frontend)"
fi

echo ""
echo "=== Deploy complete ==="
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "your-server-ip")
echo "App running at: http://${SERVER_IP}"
echo ""
echo "Next steps for SSL:"
echo "  1. Point your domain DNS (A record) to ${SERVER_IP}"
echo "  2. Run certbot:"
echo "     docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain.com"
echo "  3. Edit nginx/nginx.conf: uncomment SSL lines, replace 'your-domain.com'"
echo "  4. Restart nginx:"
echo "     docker compose -f docker-compose.prod.yml restart nginx"
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.prod.yml logs -f backend   # Backend logs"
echo "  docker compose -f docker-compose.prod.yml logs -f frontend  # Frontend logs"
echo "  docker compose -f docker-compose.prod.yml down              # Stop all"
echo "  docker compose -f docker-compose.prod.yml up -d --build     # Rebuild & restart"
