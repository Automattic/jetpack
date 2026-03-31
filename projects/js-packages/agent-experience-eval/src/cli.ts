#!/usr/bin/env node

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { evaluate } from './evaluator.js';
import type { EvaluationResult, CriterionResult } from './schema.js';

/**
 * Prints CLI usage information.
 */
function printUsage(): void {
	console.log( `Usage: agent-experience-eval [options]

Options:
  -o, --output <path>   Write JSON to file (default: stdout)
  --repo <path>         Repository root (default: cwd)
  --model <model>       Claude model (default: claude-sonnet-4-6)
  -h, --help            Show this help message
` );
}

/**
 * Renders an ASCII progress bar.
 *
 * @param score - The achieved score.
 * @param max   - The maximum possible score.
 * @param width - Character width of the bar.
 * @return The rendered progress bar string.
 */
function progressBar( score: number, max: number, width = 20 ): string {
	const filled = max > 0 ? Math.round( ( score / max ) * width ) : 0;
	const empty = width - filled;
	return '█'.repeat( filled ) + '░'.repeat( empty );
}

/**
 * Prints a human-readable evaluation summary to the console.
 *
 * @param result - The evaluation result to summarize.
 */
function printSummary( result: EvaluationResult ): void {
	console.log( `\nScore: ${ result.score }/100 (Grade ${ result.grade })\n` );

	const criteria = result.criteria as Record< string, CriterionResult >;
	for ( const [ name, criterion ] of Object.entries( criteria ) ) {
		const label = name.replace( /_/g, ' ' ).replace( /\b\w/g, c => c.toUpperCase() );
		const bar = progressBar( criterion.score, criterion.max );
		const padded = label.padEnd( 25 );
		console.log( `  ${ padded } ${ bar }  ${ criterion.score }/${ criterion.max }` );
	}

	if ( result.issues.length > 0 ) {
		console.log( `\nIssues (${ result.issues.length }):` );
		for ( const issue of result.issues ) {
			console.log( `  - ${ issue }` );
		}
	}

	if ( result.recommendations.length > 0 ) {
		console.log( `\nRecommendations (${ result.recommendations.length }):` );
		for ( const rec of result.recommendations ) {
			console.log( `  - ${ rec }` );
		}
	}
}

/**
 * CLI entry point. Parses arguments, runs the evaluation, and outputs results.
 */
async function main(): Promise< void > {
	const { values } = parseArgs( {
		options: {
			output: { type: 'string', short: 'o' },
			repo: { type: 'string', default: process.cwd() },
			model: { type: 'string' },
			help: { type: 'boolean', short: 'h', default: false },
		},
		strict: true,
	} );

	if ( values.help ) {
		printUsage();
		process.exit( 0 );
	}

	const repoRoot = values.repo ? resolve( values.repo ) : process.cwd();

	try {
		const metadata = await evaluate( {
			repoRoot,
			model: values.model,
		} );

		const json = JSON.stringify( metadata, null, 2 );

		if ( values.output ) {
			await mkdir( dirname( values.output ), { recursive: true } );
			await writeFile( values.output, json );

			// Print human-readable summary to TTY
			if ( process.stdout.isTTY ) {
				console.log( `Output written to ${ values.output }` );
				printSummary( metadata.result );
			}
		} else {
			// Write JSON to stdout
			process.stdout.write( json + '\n' );
		}
	} catch ( error: unknown ) {
		if ( error instanceof Anthropic.AuthenticationError ) {
			console.error( 'Error: Invalid or missing ANTHROPIC_API_KEY environment variable.' );
			process.exit( 1 );
		}
		if ( error instanceof Anthropic.RateLimitError ) {
			console.error( 'Error: Rate limited — try again later.' );
			process.exit( 1 );
		}
		if ( error instanceof Anthropic.APIError ) {
			console.error( `Error: Claude API error (${ error.status }): ${ error.message }` );
			process.exit( 1 );
		}
		if ( error instanceof Error ) {
			console.error( `Error: ${ error.message }` );
			process.exit( 1 );
		}
		console.error( 'An unexpected error occurred.' );
		process.exit( 1 );
	}
}

main();
