import { Injectable } from '@nestjs/common';
import { SectionType } from './dto/section.dto';

/**
 * LaTeX Parser Service
 * 
 * GOAL 2: Section Extraction & Assembly
 * 
 * Purpose:
 * - Parse LaTeX documents into logical sections
 * - Re-assemble sections back into valid LaTeX
 * - Preserve formatting, comments, and custom commands
 * - Guarantee round-trip: extract(assemble(sections)) === original
 * 
 * Design:
 * - Marker-based extraction (comment markers in LaTeX)
 * - Fallback heuristics for unmarked documents
 * - Locked sections remain byte-identical
 * 
 * Safety:
 * - No semantic changes if sections untouched
 * - Preserves preamble and document structure
 * - Handles legacy documents gracefully
 */

export interface ExtractedSection {
  sectionType: SectionType;
  content: string;
  orderIndex: number;
  isLocked: boolean; // Default: all unlocked on first extraction
}

export interface ParsedDocument {
  preamble: string;           // Everything before \begin{document}
  sections: ExtractedSection[];
  postamble: string;          // Everything after sections (if any)
}

@Injectable()
export class LatexParserService {
  /**
   * Extract sections from LaTeX document
   * 
   * Strategy:
   * 1. Look for marker comments (% SECTION: EXPERIENCE)
   * 2. If no markers, use heuristic patterns (\section{Experience})
   * 3. If no recognizable sections, treat entire body as OTHER
   * 
   * Returns:
   * - preamble: Document header (up to \begin{document})
   * - sections: Extracted content blocks
   * - postamble: Closing content (after sections, before \end{document})
   */
  extractSections(latexContent: string): ParsedDocument {
    // Step 1: Extract preamble
    const documentBeginMatch = latexContent.match(/\\begin\{document\}/);
    if (!documentBeginMatch) {
      // Invalid LaTeX - treat entire content as OTHER section
      console.warn('LaTeX Parser: No \\begin{document} found, treating as OTHER section');
      return {
        preamble: '',
        sections: [{
          sectionType: SectionType.OTHER,
          content: latexContent,
          orderIndex: 0,
          isLocked: false,
        }],
        postamble: '',
      };
    }

    const preambleEnd = documentBeginMatch.index! + documentBeginMatch[0].length;
    const preamble = latexContent.substring(0, preambleEnd);
    const bodyContent = latexContent.substring(preambleEnd);

    // Step 2: Find \end{document}
    const documentEndMatch = bodyContent.match(/\\end\{document\}/);
    const bodyEnd = documentEndMatch ? documentEndMatch.index! : bodyContent.length;
    const body = bodyContent.substring(0, bodyEnd);
    const postamble = bodyContent.substring(bodyEnd);

    // Step 3: Try marker-based extraction first
    const markerSections = this.extractMarkerSections(body);
    if (markerSections.length > 0) {
      console.log(`LaTeX Parser: Extracted ${markerSections.length} sections using markers`);
      return { preamble, sections: markerSections, postamble };
    }

    // Step 4: Fall back to heuristic extraction
    const heuristicSections = this.extractHeuristicSections(body);
    if (heuristicSections.length > 0) {
      console.log(`LaTeX Parser: Extracted ${heuristicSections.length} sections using heuristics:`, 
        heuristicSections.map(s => s.sectionType).join(', '));
      return { preamble, sections: heuristicSections, postamble };
    }

    // Step 5: No sections detected - treat entire body as OTHER
    console.warn('LaTeX Parser: No recognizable sections found, treating entire body as OTHER');
    console.warn('Body preview:', body.substring(0, 200));
    return {
      preamble,
      sections: [{
        sectionType: SectionType.OTHER,
        content: body.trim(),
        orderIndex: 0,
        isLocked: false,
      }],
      postamble,
    };
  }

  /**
   * Extract sections using marker comments
   * 
   * Format:
   * % SECTION: EXPERIENCE
   * \section{Work Experience}
   * ...content...
   * % END SECTION
   */
  private extractMarkerSections(body: string): ExtractedSection[] {
    const sections: ExtractedSection[] = [];
    const markerRegex = /% SECTION: (\w+)\n([\s\S]*?)(?=% SECTION: |\% END SECTION|$)/g;
    
    let match;
    let orderIndex = 0;
    
    while ((match = markerRegex.exec(body)) !== null) {
      const sectionTypeName = match[1].toUpperCase();
      const content = match[2].trim();
      
      // Validate section type
      if (this.isValidSectionType(sectionTypeName)) {
        sections.push({
          sectionType: sectionTypeName as SectionType,
          content,
          orderIndex: orderIndex++,
          isLocked: false,
        });
      }
    }
    
    return sections;
  }

  /**
   * Extract sections using heuristic patterns
   * 
   * Looks for common resume section headers:
   * - \section{Experience} / \section{Work Experience}
   * - \section{Education}
   * - \section{Projects}
   * - \section{Skills}
   * - Also handles \section*, \subsection, and custom commands
   * etc.
   */
  private extractHeuristicSections(body: string): ExtractedSection[] {
    const sections: ExtractedSection[] = [];
    
    // Define patterns for each section type - more comprehensive matching
    const patterns = [
      {
        type: SectionType.EXPERIENCE,
        patterns: [
          /\\(?:section|subsection)\*?\{[^}]*?(?:experience|employment|work\s*history|professional\s*experience|career|work\s*experience)[^}]*?\}/gi,
        ],
      },
      {
        type: SectionType.EDUCATION,
        patterns: [
          /\\(?:section|subsection)\*?\{[^}]*?(?:education|academic|qualification|training)[^}]*?\}/gi,
        ],
      },
      {
        type: SectionType.PROJECTS,
        patterns: [
          /\\(?:section|subsection)\*?\{[^}]*?(?:projects|portfolio|work\s*samples)[^}]*?\}/gi,
        ],
      },
      {
        type: SectionType.SKILLS,
        patterns: [
          /\\(?:section|subsection)\*?\{[^}]*?(?:skills|technologies|competencies|technical\s*skills|expertise|proficiencies)[^}]*?\}/gi,
        ],
      },
      {
        type: SectionType.ACHIEVEMENTS,
        patterns: [
          /\\(?:section|subsection)\*?\{[^}]*?(?:achievements|awards|honors|recognitions|accomplishments)[^}]*?\}/gi,
        ],
      },
    ];

    // Find all section boundaries
    const allSectionMatches: Array<{
      type: SectionType;
      index: number;
      header: string;
    }> = [];

    for (const { type, patterns: typePatterns } of patterns) {
      for (const pattern of typePatterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(body)) !== null) {
          // Avoid duplicate matches at same position
          const alreadyMatched = allSectionMatches.some(
            m => Math.abs(m.index - match.index) < 5
          );
          if (!alreadyMatched) {
            allSectionMatches.push({
              type,
              index: match.index,
              header: match[0],
            });
          }
        }
      }
    }

    // Sort by appearance order
    allSectionMatches.sort((a, b) => a.index - b.index);

    // If no sections found, don't return empty - let caller handle it
    if (allSectionMatches.length === 0) {
      return [];
    }

    let orderIndex = 0;

    // CRITICAL FIX: Capture content BEFORE the first \section{} as HEADER/OTHER
    // This preserves the name, contact info, title block that appears before sections
    const firstSectionStart = allSectionMatches[0].index;
    const preContent = body.substring(0, firstSectionStart).trim();
    
    if (preContent.length > 0) {
      // There is content before the first section (header block)
      sections.push({
        sectionType: SectionType.OTHER,
        content: preContent,
        orderIndex: orderIndex++,
        isLocked: false,
      });
    }

    // Extract content between section headers
    for (let i = 0; i < allSectionMatches.length; i++) {
      const current = allSectionMatches[i];
      const next = allSectionMatches[i + 1];
      
      const contentStart = current.index;
      const contentEnd = next ? next.index : body.length;
      const content = body.substring(contentStart, contentEnd).trim();

      sections.push({
        sectionType: current.type,
        content,
        orderIndex: orderIndex++,
        isLocked: false,
      });
    }

    return sections;
  }

  /**
   * Assemble sections back into complete LaTeX document
   * 
   * Strategy:
   * - Preserve preamble exactly
   * - Insert marker comments for traceability
   * - Concatenate sections in order
   * - Preserve postamble exactly
   * 
   * Guarantee: If sections unchanged, output === input (modulo markers)
   */
  assembleSections(parsed: ParsedDocument): string {
    const parts: string[] = [];

    // 1. Preamble (unchanged)
    parts.push(parsed.preamble);
    parts.push('\n');

    // 2. Sections with markers
    for (const section of parsed.sections.sort((a, b) => a.orderIndex - b.orderIndex)) {
      parts.push(`% SECTION: ${section.sectionType}\n`);
      parts.push(section.content);
      parts.push('\n% END SECTION\n\n');
    }

    // 3. Postamble (unchanged)
    parts.push(parsed.postamble);

    return parts.join('');
  }

  /**
   * Assemble specific sections with modifications
   * 
   * Use case: AI modified only EXPERIENCE section
   * - Locked sections use original content
   * - Unlocked sections use modified content (if provided)
   * - Unmodified unlocked sections use original content
   */
  assembleWithModifications(
    parsed: ParsedDocument,
    modifications: Map<SectionType, string>,
    lockedSections: Set<SectionType>,
  ): string {
    const modifiedParsed: ParsedDocument = {
      preamble: parsed.preamble,
      postamble: parsed.postamble,
      sections: parsed.sections.map(section => {
        // Locked sections: use original
        if (lockedSections.has(section.sectionType)) {
          return section;
        }

        // Unlocked sections: use modification if exists
        const modifiedContent = modifications.get(section.sectionType);
        if (modifiedContent !== undefined) {
          return {
            ...section,
            content: modifiedContent,
          };
        }

        // Unlocked, unmodified: use original
        return section;
      }),
    };

    return this.assembleSections(modifiedParsed);
  }

  /**
   * Validate section type string
   */
  private isValidSectionType(typeName: string): boolean {
    return Object.values(SectionType).includes(typeName as SectionType);
  }

  /**
   * Add markers to unmarked LaTeX (for migration)
   * 
   * Use case: Legacy document without markers
   * - Extract using heuristics
   * - Add markers for future processing
   * - Return marked version
   */
  addMarkers(latexContent: string): string {
    const parsed = this.extractSections(latexContent);
    return this.assembleSections(parsed);
  }
}
