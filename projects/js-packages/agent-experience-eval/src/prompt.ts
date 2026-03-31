import type { DiscoveredFile } from './discovery.js';
import type { ValidationResult } from './validator.js';

const RUBRIC = `Score this repository's AI agent experience against this rubric:

1. Commands/Workflows (0-20): Are build, test, lint, deploy commands documented?
2. Architecture Clarity (0-20): Is there a codebase map with directories, modules, data flow?
3. Non-obvious Patterns (0-15): Are gotchas, quirks, workarounds, edge cases documented?
4. Conciseness (0-15): Is the content dense and valuable without filler?
5. Currency (0-15): Do commands work, are file refs accurate, is the stack current?
6. Actionability (0-15): Are there copy-paste ready commands and concrete steps?

IMPORTANT:
- The "score" field must equal the sum of all criteria scores.
- The "grade" must match: A (90-100), B (70-89), C (50-69), D (30-49), F (0-29).
- If the repository contains multiple modules, packages, or distinct components, score each part independently. Missing AI instructions in any significant part should bring the cumulative score down.
- Be extremely critical.
- The "files_found" field should list all the AI instruction file paths provided below.`;

/** Maximum prompt size in characters (~45K tokens). */
const MAX_PROMPT_CHARS = 180_000;

export interface PromptResult {
	prompt: string;
	truncated: boolean;
}

/**
 * Builds the evaluation prompt from discovered files and validation results.
 *
 * @param files      - Discovered AI instruction files with their contents.
 * @param validation - Currency validation results (path/command checks).
 * @return The assembled prompt string and whether it was truncated.
 */
export function buildPrompt( files: DiscoveredFile[], validation: ValidationResult ): PromptResult {
	const parts: string[] = [ RUBRIC ];

	if ( files.length === 0 ) {
		parts.push( '\nNo AI instruction files were found. Score 0, grade F.' );
		return { prompt: parts.join( '\n' ), truncated: false };
	}

	parts.push( `\n## AI instruction files found (${ files.length }):\n` );
	for ( const file of files ) {
		parts.push( `### ${ file.relativePath }\n\`\`\`\n${ file.content }\n\`\`\`\n` );
	}

	if ( validation.referencedPaths.length > 0 || validation.referencedCommands.length > 0 ) {
		parts.push( '\n## Currency validation results:\n' );

		for ( const ref of validation.referencedPaths ) {
			const status = ref.exists ? 'EXISTS' : 'MISSING';
			parts.push( `- Path \`${ ref.path }\` (in ${ ref.referencedIn }): ${ status }` );
		}

		for ( const cmd of validation.referencedCommands ) {
			const status = cmd.found ? `found in ${ cmd.foundIn }` : 'NOT FOUND';
			parts.push( `- Command \`${ cmd.command }\` (in ${ cmd.referencedIn }): ${ status }` );
		}
	}

	const assembled = parts.join( '\n' );

	if ( assembled.length > MAX_PROMPT_CHARS ) {
		return {
			prompt: assembled.slice( 0, MAX_PROMPT_CHARS ) + '\n\n[Prompt truncated due to size]',
			truncated: true,
		};
	}

	return { prompt: assembled, truncated: false };
}
