import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

/**
 * Users Service
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - Minimal user persistence only
 * - Find or create user by clerkId
 * - No profile updates
 * - No business logic
 * 
 * From database.md:
 * - User table: id, clerkId, email, createdAt, updatedAt
 * - clerkId is unique external identifier
 * 
 * TODO (PHASE 3+): Add user profile updates
 * TODO (PHASE 3+): Add user preferences
 * TODO (PHASE 3+): Add user settings
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or create user by Clerk ID
   * 
   * PHASE 2: Minimal implementation
   * - Creates user if not exists
   * - Returns existing user if found
   * - No updates to existing users
   * 
   * @param clerkId - Clerk external user ID
   * @param email - User email from Clerk
   * @returns User record
   */
  async findOrCreateByClerkId(clerkId: string, email: string): Promise<User> {
    // Try to find existing user
    let user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    // Create if not exists
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
        },
      });
    }

    return user;
  }

  /**
   * Find user by internal UUID
   * 
   * @param id - User UUID
   * @returns User record or null
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // TODO (PHASE 3+): Add updateProfile()
  // TODO (PHASE 3+): Add updatePreferences()
  // TODO (PHASE 3+): Add deleteUser()
}
