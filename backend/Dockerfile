# Backend Dockerfile - NestJS Application

FROM node:20-alpine AS base

# Install OpenSSL for Prisma and full TeX Live for LaTeX compilation
# Alpine 3.17+ uses OpenSSL 3.x, but we need compatibility libs
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    texlive-full

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Use npm ci with cache to speed up builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./start.sh

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Change ownership of files
RUN chown -R nestjs:nodejs /app
RUN chmod +x /app/start.sh

USER nestjs

# Cloud Run uses PORT 8080 by default
ENV PORT=8080
EXPOSE 8080

# Run migrations and start the server
CMD ["./start.sh"]
