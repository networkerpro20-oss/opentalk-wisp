# 🚀 ESTRATEGIA DE DESPLIEGUE Y DEVOPS - OpenTalkWisp

**Proyecto:** CRM Omnicanal SaaS Multi-Empresa  
**Fecha:** 10 de diciembre de 2025  
**Documento:** 08 - Despliegue y DevOps Completo

---

## 🎯 OBJETIVO

Definir una estrategia completa de despliegue que incluya:
- ✅ Entornos (desarrollo, staging, producción)
- ✅ CI/CD automatizado
- ✅ Infraestructura como código
- ✅ Monitoreo y alertas
- ✅ Backups y disaster recovery
- ✅ Escalabilidad automática

---

## 🌍 ENTORNOS

### 1. Development (Local)

**Propósito:** Desarrollo activo por developers

```yaml
# docker-compose.dev.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: opentalkwisp-db-dev
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: opentalkwisp_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_dev:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: opentalkwisp-redis-dev
    ports:
      - '6379:6379'

  mailhog:
    image: mailhog/mailhog
    container_name: opentalkwisp-mail-dev
    ports:
      - '1025:1025'  # SMTP
      - '8025:8025'  # Web UI

volumes:
  postgres_dev:
```

**Comandos:**
```bash
# Iniciar servicios
docker-compose -f docker-compose.dev.yml up -d

# Backend (watch mode)
cd apps/backend
pnpm dev

# Frontend (hot reload)
cd apps/frontend
pnpm dev
```

**URLs:**
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- Mailhog: http://localhost:8025
- Prisma Studio: http://localhost:5555

---

### 2. Staging (Pre-producción)

**Propósito:** Testing final antes de producción

**Infraestructura:**
```
VPS/Droplet:
  - 4 vCPU
  - 8 GB RAM
  - 80 GB SSD
  - Costo: ~$40/mes (Hetzner/DigitalOcean)

URL: https://staging.opentalkwisp.com
```

**Docker Compose:**
```yaml
# docker-compose.staging.yml
version: '3.9'

services:
  backend:
    image: ghcr.io/tu-org/opentalkwisp-backend:staging
    restart: always
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: staging
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    image: ghcr.io/tu-org/opentalkwisp-frontend:staging
    restart: always
    ports:
      - '3001:3000'
    environment:
      NEXT_PUBLIC_API_URL: https://staging-api.opentalkwisp.com
    depends_on:
      - backend

  postgres:
    image: postgres:15-alpine
    restart: always
    volumes:
      - postgres_staging:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: opentalkwisp_staging
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_staging:/data

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/staging.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - backend
      - frontend

volumes:
  postgres_staging:
  redis_staging:
```

---

### 3. Production (Producción)

**Propósito:** Entorno de producción para clientes reales

**Arquitectura Inicial (0-500 clientes):**
```
                  ┌─────────────┐
                  │ Cloudflare  │
                  │  (CDN+SSL)  │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │   Nginx     │
                  │ Load Balancer│
                  └──────┬──────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │Backend 1│     │Backend 2│     │Frontend │
   │ (NestJS)│     │ (NestJS)│     │(Next.js)│
   └────┬────┘     └────┬────┘     └─────────┘
        │                │
        └────────┬───────┘
                 │
        ┌────────▼────────┐
        │  PostgreSQL     │
        │  (Managed HA)   │
        └─────────────────┘
        
        ┌─────────────────┐
        │  Redis Cluster  │
        │    (3 nodes)    │
        └─────────────────┘
```

**Infraestructura:**
```
Application Servers (2x):
  - 4 vCPU, 8 GB RAM cada uno
  - Auto-scaling group
  - Costo: $80/mes

Database (PostgreSQL Managed):
  - 4 vCPU, 16 GB RAM
  - High Availability (master-replica)
  - Automated backups (daily)
  - Costo: $200/mes

Redis Cluster:
  - 3 nodes (HA)
  - 2 GB RAM cada uno
  - Costo: $60/mes

Load Balancer:
  - Costo: $20/mes

CDN (Cloudflare Pro):
  - Costo: $20/mes

Storage (S3-compatible):
  - 500 GB
  - Costo: $30/mes

Monitoring (DataDog):
  - Costo: $50/mes

TOTAL: ~$460/mes
```

---

## 🔨 CI/CD PIPELINE

### GitHub Actions

```yaml
# .github/workflows/deploy.yml

name: Deploy Pipeline

on:
  push:
    branches:
      - main        # Production
      - develop     # Staging

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Lint
        run: pnpm lint
        
      - name: Type check
        run: pnpm type-check
        
      - name: Run tests
        run: pnpm test:cov
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-backend:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./apps/backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend
          
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./apps/frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.API_URL }}

  deploy-staging:
    needs: [build-backend, build-frontend]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Deploy to Staging
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/opentalkwisp
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T backend pnpm db:migrate
            
      - name: Health check
        run: |
          sleep 10
          curl -f https://staging.opentalkwisp.com/health || exit 1
          
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  deploy-production:
    needs: [build-backend, build-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to Production (Blue-Green)
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/opentalkwisp
            
            # Pull new images
            docker-compose -f docker-compose.prod.yml pull
            
            # Start new containers (blue)
            docker-compose -f docker-compose.blue.yml up -d
            
            # Wait and health check
            sleep 30
            curl -f http://localhost:3001/health || exit 1
            
            # Switch nginx to blue
            ln -sf /etc/nginx/sites-available/blue /etc/nginx/sites-enabled/current
            nginx -s reload
            
            # Stop old containers (green)
            docker-compose -f docker-compose.green.yml down
            
            # Rename blue to green for next deployment
            mv docker-compose.blue.yml docker-compose.green.yml
            
      - name: Run database migrations
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/opentalkwisp
            docker-compose exec -T backend pnpm db:migrate
            
      - name: Smoke tests
        run: |
          curl -f https://opentalkwisp.com/health
          curl -f https://opentalkwisp.com/api/health
          
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '🚀 Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🐳 DOCKERFILES

### Backend Dockerfile

```dockerfile
# apps/backend/Dockerfile

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built app
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/apps/backend

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start
CMD ["node", "dist/main.js"]
```

### Frontend Dockerfile

```dockerfile
# apps/frontend/Dockerfile

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/frontend ./apps/frontend

WORKDIR /app/apps/frontend

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
```

---

## 🔧 NGINX CONFIGURATION

```nginx
# /etc/nginx/sites-available/opentalkwisp.conf

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream servers
upstream backend {
    least_conn;
    server backend-1:3000 max_fails=3 fail_timeout=30s;
    server backend-2:3000 max_fails=3 fail_timeout=30s;
}

upstream frontend {
    server frontend:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name opentalkwisp.com www.opentalkwisp.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name opentalkwisp.com www.opentalkwisp.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # API routes
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://backend/auth/login;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 📊 MONITORING Y ALERTAS

### 1. Application Monitoring (DataDog/NewRelic)

**Setup DataDog:**
```yaml
# docker-compose.prod.yml

services:
  datadog-agent:
    image: datadog/agent:latest
    environment:
      - DD_API_KEY=${DATADOG_API_KEY}
      - DD_SITE=datadoghq.com
      - DD_LOGS_ENABLED=true
      - DD_APM_ENABLED=true
      - DD_APM_NON_LOCAL_TRAFFIC=true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
```

**NestJS Integration:**
```typescript
// src/main.ts
import * as dd from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  dd.init({
    service: 'opentalkwisp-backend',
    env: process.env.NODE_ENV,
    logInjection: true,
  });
}
```

### 2. Database Monitoring

```sql
-- Create monitoring user
CREATE USER monitoring WITH PASSWORD 'secure_password';
GRANT pg_monitor TO monitoring;

-- Slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
SELECT pg_reload_conf();

-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**Queries to monitor:**
```sql
-- Top 10 slowest queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Database size
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

### 3. Alerting Rules

**PagerDuty/Slack Alerts:**
```yaml
# alerts.yml

alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    notify: ['pagerduty', 'slack']

  - name: High Response Time
    condition: p95_response_time > 1000ms
    duration: 10m
    severity: warning
    notify: ['slack']

  - name: Database Connection Pool Exhausted
    condition: db_connections > 90%
    duration: 2m
    severity: critical
    notify: ['pagerduty']

  - name: High Memory Usage
    condition: memory_usage > 85%
    duration: 5m
    severity: warning
    notify: ['slack']

  - name: Disk Space Low
    condition: disk_usage > 80%
    duration: 5m
    severity: critical
    notify: ['pagerduty', 'slack']

  - name: SSL Certificate Expiring
    condition: ssl_cert_days_remaining < 30
    severity: warning
    notify: ['email']
```

---

## 💾 BACKUP STRATEGY

### 1. Database Backups

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

set -e

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="opentalkwisp"
S3_BUCKET="s3://opentalkwisp-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
echo "Creating database backup..."
pg_dump -h localhost -U postgres $DB_NAME | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz" "$S3_BUCKET/postgres/"

# Keep only last 7 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Keep only last 30 days in S3
aws s3 ls "$S3_BUCKET/postgres/" | while read -r line; do
  createDate=$(echo $line | awk '{print $1" "$2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk '{print $4}')
    aws s3 rm "$S3_BUCKET/postgres/$fileName"
  fi
done

echo "Backup completed: ${DB_NAME}_${TIMESTAMP}.sql.gz"
```

**Cron Job:**
```cron
# Backup every day at 2 AM
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1

# Weekly full backup (Sunday 3 AM)
0 3 * * 0 /opt/scripts/backup-full.sh >> /var/log/backup-full.log 2>&1
```

### 2. Application Backups

```bash
#!/bin/bash
# /opt/scripts/backup-files.sh

BACKUP_DIR="/backups/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="s3://opentalkwisp-backups"

# Backup uploaded files
tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" /var/opentalkwisp/uploads

# Upload to S3
aws s3 cp "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" "$S3_BUCKET/files/"

# Cleanup
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
```

### 3. Restore Procedure

```bash
#!/bin/bash
# /opt/scripts/restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: restore-db.sh <backup_file.sql.gz>"
  exit 1
fi

# Stop application
docker-compose stop backend

# Restore database
echo "Restoring database from $BACKUP_FILE..."
gunzip < "$BACKUP_FILE" | psql -h localhost -U postgres opentalkwisp

# Start application
docker-compose start backend

echo "Restore completed"
```

---

## 🔄 AUTO-SCALING

### Horizontal Pod Autoscaler (Kubernetes)

```yaml
# k8s/hpa.yml

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

---

## 🛡️ SECURITY HARDENING

### 1. Firewall Rules (UFW)

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Deny all other incoming
ufw default deny incoming
ufw default allow outgoing

# Enable
ufw enable
```

### 2. Fail2Ban

```ini
# /etc/fail2ban/jail.local

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

### 3. SSL/TLS Best Practices

```bash
# Generate strong DH parameters
openssl dhparam -out /etc/nginx/dhparam.pem 4096

# Auto-renew Let's Encrypt
certbot renew --dry-run
```

**Cron:**
```cron
0 3 * * * certbot renew --quiet --post-hook "nginx -s reload"
```

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment
```
✅ All tests passing (unit, integration, E2E)
✅ Code review approved
✅ Database migrations tested
✅ Environment variables configured
✅ Secrets rotated (if needed)
✅ Backup completed
✅ Rollback plan documented
✅ Team notified
```

### During Deployment
```
✅ Put application in maintenance mode (optional)
✅ Run database migrations
✅ Deploy new version
✅ Health checks passing
✅ Smoke tests passing
✅ Monitor error rates
```

### Post-Deployment
```
✅ Verify key features working
✅ Check performance metrics
✅ Review logs for errors
✅ Monitor for 30 minutes
✅ Notify team of completion
✅ Update changelog
```

---

## 🚨 DISASTER RECOVERY

### RTO (Recovery Time Objective): 1 hour
### RPO (Recovery Point Objective): 24 hours

**Procedure:**
1. Assess the issue (5 min)
2. Decide: Rollback or Fix Forward (5 min)
3. Execute recovery (20 min)
4. Verify functionality (15 min)
5. Monitor and stabilize (15 min)

**Rollback Procedure:**
```bash
# Revert to previous version
git revert <commit-hash>
git push origin main

# Or use blue-green deployment
./scripts/rollback.sh
```

---

## ✅ CONCLUSIÓN

**Estrategia DevOps Completa:**
- ✅ 3 entornos (dev, staging, prod)
- ✅ CI/CD automatizado con GitHub Actions
- ✅ Docker + Docker Compose
- ✅ Nginx reverse proxy + load balancing
- ✅ Monitoring con DataDog
- ✅ Backups automáticos diarios
- ✅ Auto-scaling configurado
- ✅ Security hardening aplicado
- ✅ Disaster recovery plan

**Timeline Implementación:**
- Semana 1: Setup dev environment
- Semana 2: Setup CI/CD pipeline
- Semana 4: Deploy staging
- Semana 8: Deploy production
- Semana 12: Monitoring completo

**Costo Operacional:** ~$460/mes (producción inicial)

---

## 🎉 FIN DEL ANÁLISIS COMPLETO

**8 Documentos Creados:**
1. ✅ Viabilidad Técnica (Score: 89%)
2. ✅ Arquitectura Multi-Tenant
3. ✅ Stack Tecnológico Completo
4. ✅ Diseño de Base de Datos
5. ✅ Roadmap 12 Meses
6. ✅ Análisis Costos y ROI
7. ✅ Plan de Testing
8. ✅ Despliegue y DevOps

**PROYECTO LISTO PARA DESARROLLO** 🚀

