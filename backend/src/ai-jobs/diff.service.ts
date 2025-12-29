import { Injectable } from '@nestjs/common';
import * as Diff from 'diff';

/**
 * Diff Service
 * 
 * PHASE 6: AI RESUME TAILORING (PROPOSAL ONLY)
 * - Generates deterministic diff between base and proposed resume
 * - No semantic interpretation
 * - Line-based text comparison only
 * 
 * Forbidden:
 * - No auto-accept
 * - No resume mutation
 */

export interface DiffResult {
  added: string[];
  removed: string[];
  unchanged: string[];
}

@Injectable()
export class DiffService {
  /**
   * Generate diff between base and proposed resume content
   * 
   * Uses line-based diffing for deterministic results
   * Returns structured data showing added/removed/unchanged lines
   * 
   * @param baseContent - Original resume latexContent
   * @param proposedContent - AI-generated proposed latexContent
   * @returns Structured diff result
   */
  generateDiff(baseContent: string, proposedContent: string): DiffResult {
    // Use line-based diff for deterministic comparison
    const changes = Diff.diffLines(baseContent, proposedContent);

    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    for (const change of changes) {
      const lines = change.value.split('\n').filter(line => line.length > 0);

      if (change.added) {
        added.push(...lines);
      } else if (change.removed) {
        removed.push(...lines);
      } else {
        unchanged.push(...lines);
      }
    }

    return {
      added,
      removed,
      unchanged,
    };
  }

  /**
   * Generate unified diff format
   * 
   * Returns traditional unified diff output for display
   * Useful for showing changes in a familiar format
   * 
   * @param baseContent - Original resume latexContent
   * @param proposedContent - AI-generated proposed latexContent
   * @param baseLabel - Label for base version (e.g., "Base Resume")
   * @param proposedLabel - Label for proposed version (e.g., "AI Proposal")
   * @returns Unified diff string
   */
  generateUnifiedDiff(
    baseContent: string,
    proposedContent: string,
    baseLabel: string = 'base',
    proposedLabel: string = 'proposed',
  ): string {
    return Diff.createPatch(
      'resume.tex',
      baseContent,
      proposedContent,
      baseLabel,
      proposedLabel,
    );
  }

  /**
   * Count changes between base and proposed
   * 
   * Returns simple metrics about the diff
   * Useful for displaying change summary
   * 
   * @param baseContent - Original resume latexContent
   * @param proposedContent - AI-generated proposed latexContent
   * @returns Change counts
   */
  countChanges(baseContent: string, proposedContent: string): {
    addedLines: number;
    removedLines: number;
    unchangedLines: number;
  } {
    const diff = this.generateDiff(baseContent, proposedContent);

    return {
      addedLines: diff.added.length,
      removedLines: diff.removed.length,
      unchangedLines: diff.unchanged.length,
    };
  }
}
