import type { EvaluateMetadata } from './evaluator.js';
import type { CriterionResult } from './schema.js';

const CRITERIA_ORDER: Array< { key: string; label: string } > = [
	{ key: 'commands_workflows', label: 'Commands & Workflows' },
	{ key: 'architecture_clarity', label: 'Architecture Clarity' },
	{ key: 'non_obvious_patterns', label: 'Non-obvious Patterns' },
	{ key: 'conciseness', label: 'Conciseness' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'actionability', label: 'Actionability' },
];

/**
 * Renders an ASCII progress bar.
 *
 * @param score - The achieved score.
 * @param max   - The maximum possible score.
 * @param width - Character width of the bar.
 * @return The rendered bar string.
 */
function progressBar( score: number, max: number, width = 20 ): string {
	const filled = max > 0 ? Math.round( ( score / max ) * width ) : 0;
	const empty = width - filled;
	return '█'.repeat( filled ) + '░'.repeat( empty );
}

/**
 * Formats a byte count as a human-readable size.
 *
 * @param bytes - Number of bytes.
 * @return Formatted string like "4.1 KB".
 */
function formatBytes( bytes: number ): string {
	if ( bytes < 1024 ) {
		return `${ bytes } B`;
	}
	return `${ ( bytes / 1024 ).toFixed( 1 ) } KB`;
}

/**
 * Renders a full human-readable evaluation report.
 *
 * @param metadata - The full evaluation metadata.
 * @param repoRoot - Repository root path for display.
 * @return The formatted report string.
 */
export function renderHumanReport( metadata: EvaluateMetadata, repoRoot?: string ): string {
	const { result, discovery, validation, promptTruncated, usage, model } = metadata;
	const lines: string[] = [];

	// Header
	lines.push( '' );
	lines.push( `  Agent Experience Eval` );
	lines.push( `  Score ${ result.score }/100  Grade ${ result.grade }` );
	if ( repoRoot ) {
		lines.push( `  Repo: ${ repoRoot }` );
	}
	lines.push(
		`  Model: ${ model }  Files: ${ discovery.length }  Prompt: ${
			promptTruncated ? 'truncated' : 'complete'
		}`
	);
	lines.push( '' );

	// Criteria
	lines.push( '  Criteria' );
	const criteria = result.criteria as Record< string, CriterionResult >;
	for ( const { key, label } of CRITERIA_ORDER ) {
		const c = criteria[ key ];
		if ( ! c ) {
			continue;
		}
		const bar = progressBar( c.score, c.max );
		const padded = label.padEnd( 25 );
		lines.push( `    ${ padded } ${ String( c.score ).padStart( 2 ) }/${ c.max }  ${ bar }` );
		if ( c.notes ) {
			// Wrap notes to ~76 chars indented
			const wrapped = wordWrap( c.notes, 72 );
			for ( const line of wrapped ) {
				lines.push( `      ${ line }` );
			}
		}
	}
	lines.push( '' );

	// Discovered files
	lines.push( `  Discovered Files (${ discovery.length })` );
	for ( const file of discovery ) {
		lines.push( `    ${ file.relativePath } (${ formatBytes( file.sizeBytes ) })` );
	}
	lines.push( '' );

	// Currency validation
	const missingPaths = validation.referencedPaths.filter( r => ! r.exists );
	const missingCommands = validation.referencedCommands.filter( r => ! r.found );

	lines.push( '  Currency Validation' );
	lines.push(
		`    Paths checked: ${ validation.referencedPaths.length }  Missing: ${ missingPaths.length }`
	);
	lines.push(
		`    Commands checked: ${ validation.referencedCommands.length }  Missing: ${ missingCommands.length }`
	);

	if ( missingPaths.length > 0 ) {
		lines.push( '' );
		lines.push( '  Missing Paths' );
		for ( const ref of missingPaths ) {
			lines.push( `    ${ ref.path }  (in ${ ref.referencedIn })` );
		}
	}

	if ( missingCommands.length > 0 ) {
		lines.push( '' );
		lines.push( '  Missing Commands' );
		for ( const ref of missingCommands ) {
			lines.push( `    ${ ref.command }  (in ${ ref.referencedIn })` );
		}
	}
	lines.push( '' );

	// Issues
	if ( result.issues.length > 0 ) {
		lines.push( `  Issues (${ result.issues.length })` );
		for ( const issue of result.issues ) {
			lines.push( `    - ${ issue }` );
		}
		lines.push( '' );
	}

	// Recommendations
	if ( result.recommendations.length > 0 ) {
		lines.push( `  Recommendations (${ result.recommendations.length })` );
		for ( let i = 0; i < result.recommendations.length; i++ ) {
			lines.push( `    ${ i + 1 }. ${ result.recommendations[ i ] }` );
		}
		lines.push( '' );
	}

	// Metadata
	lines.push( `  Tokens: ${ usage.inputTokens } input, ${ usage.outputTokens } output` );
	if ( metadata.requestId ) {
		lines.push( `  Request ID: ${ metadata.requestId }` );
	}
	lines.push( '' );

	return lines.join( '\n' );
}

/**
 * Wraps text to a given width at word boundaries.
 *
 * @param text     - The text to wrap.
 * @param maxWidth - Maximum line width.
 * @return Array of wrapped lines.
 */
function wordWrap( text: string, maxWidth: number ): string[] {
	const words = text.split( /\s+/ );
	const result: string[] = [];
	let current = '';

	for ( const word of words ) {
		if ( current.length + word.length + 1 > maxWidth && current.length > 0 ) {
			result.push( current );
			current = word;
		} else {
			current = current.length > 0 ? `${ current } ${ word }` : word;
		}
	}
	if ( current.length > 0 ) {
		result.push( current );
	}

	return result;
}
