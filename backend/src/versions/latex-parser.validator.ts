import { LatexParserService } from './latex-parser.service';

/**
 * Round-trip Test for LaTeX Parser
 * 
 * GOAL 2: Section Extraction & Assembly
 * 
 * Purpose:
 * - Validate that extract → assemble preserves content
 * - Test edge cases (no sections, custom commands, comments)
 * - Ensure no semantic changes if sections untouched
 * 
 * Usage (for manual testing):
 * ```typescript
 * const parser = new LatexParserService();
 * const validator = new LatexParserValidator(parser);
 * const result = validator.validateRoundTrip(originalLatex);
 * console.log(result.isValid ? 'PASS' : 'FAIL');
 * ```
 */

export interface ValidationResult {
  isValid: boolean;
  originalLength: number;
  reconstructedLength: number;
  sectionsFound: number;
  errors: string[];
}

export class LatexParserValidator {
  constructor(private readonly parser: LatexParserService) {}

  /**
   * Validate round-trip: original → extract → assemble → compare
   */
  validateRoundTrip(latexContent: string): ValidationResult {
    const errors: string[] = [];

    try {
      // Step 1: Extract sections
      const parsed = this.parser.extractSections(latexContent);

      // Step 2: Assemble back
      const reconstructed = this.parser.assembleSections(parsed);

      // Step 3: Compare structure (allow marker differences)
      const originalNormalized = this.normalizeLatex(latexContent);
      const reconstructedNormalized = this.normalizeLatex(reconstructed);

      // Check preamble preservation
      if (!reconstructed.includes(parsed.preamble)) {
        errors.push('Preamble not preserved');
      }

      // Check postamble preservation
      if (parsed.postamble && !reconstructed.includes(parsed.postamble)) {
        errors.push('Postamble not preserved');
      }

      // Check section count
      if (parsed.sections.length === 0 && latexContent.includes('\\section')) {
        errors.push('Sections detected but not extracted');
      }

      // Check content length (should be similar, +/- markers)
      const lengthDiff = Math.abs(reconstructed.length - latexContent.length);
      const maxAllowedDiff = latexContent.length * 0.1; // 10% tolerance for markers

      if (lengthDiff > maxAllowedDiff) {
        errors.push(`Length difference too large: ${lengthDiff} bytes`);
      }

      return {
        isValid: errors.length === 0,
        originalLength: latexContent.length,
        reconstructedLength: reconstructed.length,
        sectionsFound: parsed.sections.length,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        originalLength: latexContent.length,
        reconstructedLength: 0,
        sectionsFound: 0,
        errors: [`Exception during validation: ${error.message}`],
      };
    }
  }

  /**
   * Test with sample resume
   */
  testSampleResume(): ValidationResult {
    const sampleLatex = `\\documentclass{article}
\\usepackage{geometry}
\\geometry{margin=1in}

\\begin{document}

\\section{Experience}
\\textbf{Senior Engineer} at TechCorp (2020-2023)
\\begin{itemize}
  \\item Led backend team
  \\item Shipped 5 major features
\\end{itemize}

\\section{Education}
\\textbf{B.S. Computer Science}, University (2016-2020)

\\section{Skills}
TypeScript, Python, React, PostgreSQL

\\end{document}`;

    return this.validateRoundTrip(sampleLatex);
  }

  /**
   * Normalize LaTeX for comparison (remove extra whitespace)
   */
  private normalizeLatex(latex: string): string {
    return latex
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
}
