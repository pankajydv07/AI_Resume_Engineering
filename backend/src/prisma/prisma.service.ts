import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - Manages database connection lifecycle
 * - Extends PrismaClient for full database access
 * - Connects on module init
 * - Disconnects on module destroy
 * 
 * From database.md:
 * - Database: PostgreSQL
 * - ORM: Prisma
 * - Connection via DATABASE_URL environment variable
 * 
 * Usage in services:
 * - Inject PrismaService
 * - Use this.prisma.user.findUnique(), etc.
 * 
 * TODO (PHASE 3+): Add query logging
 * TODO (PHASE 3+): Add error handling middleware
 * TODO (PHASE 3+): Add transaction helpers
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Connect to database when module initializes
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Disconnect from database when module is destroyed
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
