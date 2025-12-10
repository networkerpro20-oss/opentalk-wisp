FROM node:20-alpine AS base
RUN npm install -g pnpm@8.15.0

# Dependencies stage
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/backend
RUN pnpm prisma generate
RUN pnpm build
RUN pnpm prune --prod

# Production stage
FROM base AS production
WORKDIR /app

# Copy necessary files
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/prisma ./prisma
COPY --from=build /app/apps/backend/package.json ./package.json
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
