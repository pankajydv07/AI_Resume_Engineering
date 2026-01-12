# Backend Dockerfile - NestJS Application

FROM node:20-alpine AS base

# Install OpenSSL for Prisma and TexLive for LaTeX compilation
RUN apk add --no-cache \
    openssl \
    texlive-full

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

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

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Change ownership of files
RUN chown -R nestjs:nodejs /app

USER nestjs

# Cloud Run uses PORT 8080 by default
ENV PORT=8080
EXPOSE 8080

# Start the server without running migrations
# Migrations should be run separately via Cloud Build or manually
CMD ["node", "dist/main"]
