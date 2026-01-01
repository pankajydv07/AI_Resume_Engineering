import { IsEnum, IsString, IsBoolean, IsInt, Min } from 'class-validator';

/**
 * Section DTOs for ResumeSection operations
 * 
 * GOAL 1: Resume Section Model
 * - Section belongs to ResumeVersion (immutability)
 * - Stable sectionType key via enum
 * - Lock state for AI control
 * - Ordering support
 */

export enum SectionType {
  EDUCATION = 'EDUCATION',
  EXPERIENCE = 'EXPERIENCE',
  PROJECTS = 'PROJECTS',
  SKILLS = 'SKILLS',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  OTHER = 'OTHER',
}

/**
 * Section data in API responses
 */
export interface SectionDto {
  id: string;
  versionId: string;
  sectionType: SectionType;
  content: string;
  isLocked: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create section request
 */
export class CreateSectionDto {
  @IsEnum(SectionType)
  sectionType: SectionType;

  @IsString()
  content: string;

  @IsBoolean()
  isLocked: boolean;

  @IsInt()
  @Min(0)
  orderIndex: number;
}

/**
 * Update section request
 */
export class UpdateSectionDto {
  @IsString()
  content?: string;

  @IsBoolean()
  isLocked?: boolean;

  @IsInt()
  @Min(0)
  orderIndex?: number;
}

/**
 * Helper: Convert Prisma enum to DTO enum
 */
export function toPrismaSectionType(type: SectionType): string {
  return type; // Enums are compatible
}

/**
 * Helper: Convert section type to lowercase key
 * Useful for frontend display
 */
export function sectionTypeToKey(type: SectionType): string {
  return type.toLowerCase();
}
