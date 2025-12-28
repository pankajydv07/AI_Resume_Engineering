import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Module
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - Provides PrismaService to entire application
 * - Manages database connection lifecycle
 * - Global module for easy DI across all modules
 * 
 * From database.md:
 * - Database: PostgreSQL
 * - ORM: Prisma
 * - ID strategy: UUID (string)
 * - Timestamps: createdAt, updatedAt
 * 
 * Connection:
 * - Uses DATABASE_URL from .env
 * - Auto-connects on module init
 * - Auto-disconnects on module destroy
 * 
 * TODO (PHASE 3+): Add migrations in CI/CD
 * TODO (PHASE 3+): Add connection pooling config
 * TODO (PHASE 3+): Add read replicas support
 */
@Global() // Makes PrismaService available everywhere without importing PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
