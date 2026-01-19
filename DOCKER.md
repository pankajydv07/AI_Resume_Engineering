# Docker Setup Guide

This document explains how to run the JD-Aware Resume Engineering SaaS using Docker.

## Prerequisites

- Docker Desktop installed
- Docker Compose installed (included with Docker Desktop)

## Quick Start

### 1. Environment Setup

Create a single `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `CLERK_PUBLISHABLE_KEY` - Get from https://dashboard.clerk.com/
- `CLERK_SECRET_KEY` - Get from https://dashboard.clerk.com/
- `NEBIUS_API_KEY` - Get from https://studio.nebius.ai/
- `CLOUDINARY_URL` - Get from https://cloudinary.com/

**Note**: The application now uses a single `.env` file in the root directory for all services (frontend, backend, and docker-compose). You don't need separate `.env` files for each service.

### 2. Build and Run

Start all services:

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## Services

### PostgreSQL Database
- Container: `resumedb`
- Port: 5432
- Database: `resumedb`
- User: `postgres`
- Password: `pankaj` (change in production)

### Backend (NestJS)
- Container: `resume-backend`
- Port: 3001
- Auto-runs Prisma migrations on startup

### Frontend (Next.js)
- Container: `resume-frontend`
- Port: 3000

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ deletes database data)
```bash
docker-compose down -v
```

### Rebuild Specific Service
```bash
docker-compose up -d --build backend
```

### Execute Commands in Containers

Run Prisma commands:
```bash
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate dev
```

Access PostgreSQL:
```bash
docker-compose exec postgres psql -U postgres -d resumedb
```

### Database Migrations

Migrations run automatically on backend startup. To run manually:

```bash
docker-compose exec backend npx prisma migrate deploy
```

## Development vs Production

### Development Mode

For local development with hot reload, use the standard `npm run dev` approach instead of Docker.

### Production Deployment

1. Update environment variables in `.env`
2. Change database credentials
3. Use proper secrets management
4. Consider using Docker Swarm or Kubernetes for orchestration

## Troubleshooting

### Backend can't connect to database
- Ensure postgres service is healthy: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

### Port already in use
- Change ports in `docker-compose.yml`
- Or stop conflicting services

### Fresh database needed
```bash
docker-compose down -v
docker-compose up --build
```

## Network Architecture

All services communicate via the `resume-network` bridge network:
- Frontend → Backend: http://backend:3001
- Backend → PostgreSQL: postgresql://postgres:5432

External access:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
