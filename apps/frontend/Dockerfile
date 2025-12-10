FROM node:20-alpine AS base
RUN npm install -g pnpm@8.15.0

# Dependencies stage
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/frontend

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build
RUN pnpm prune --prod

# Production stage
FROM base AS production
WORKDIR /app

# Copy built application
COPY --from=build /app/apps/frontend/.next ./.next
COPY --from=build /app/apps/frontend/node_modules ./node_modules
COPY --from=build /app/apps/frontend/package.json ./package.json
COPY --from=build /app/apps/frontend/public ./public
COPY --from=build /app/apps/frontend/next.config.js ./next.config.js

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
