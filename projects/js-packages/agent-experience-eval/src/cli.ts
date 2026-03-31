#!/usr/bin/env node

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { evaluate } from './evaluator.js';
import { renderHumanReport } from './human-output.js';

/**
 * Prints CLI usage information.
 */
function printUsage(): void {
	console.log( `Usage: agent-experience-eval [options]

Options:
  -o, --output <path>           Write output to file (default: stdout)
  --repo <path>                 Repository root (default: cwd)
  --model <model>               Claude model (default: claude-sonnet-4-6)
  --format <json|human|auto>    Output format (default: auto)
                                  auto: human on TTY, JSON when piped
  -h, --help                    Show this help message

Examples:
  agent-experience-eval                          # human report to terminal
  agent-experience-eval -o eval.json             # JSON to file, human summary to terminal
  agent-experience-eval --format json            # JSON to stdout (for piping)
  agent-experience-eval --format human -o r.txt  # human report to file
` );
}

/**
 * Resolves the effective output format.
 *
 * @param format - Explicit format choice or "auto".
 * @return The resolved format: "json" or "human".
 */
function resolveFormat( format: string ): 'json' | 'human' {
	if ( format === 'json' ) {
		return 'json';
	}
	if ( format === 'human' ) {
		return 'human';
	}
	// auto: human on TTY, JSON when piped
	return process.stdout.isTTY ? 'human' : 'json';
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
			format: { type: 'string', default: 'auto' },
			help: { type: 'boolean', short: 'h', default: false },
		},
		strict: true,
	} );

	if ( values.help ) {
		printUsage();
		process.exit( 0 );
	}

	const repoRoot = values.repo ? resolve( values.repo ) : process.cwd();
	const formatValue = values.format ?? 'auto';
	if ( ! [ 'json', 'human', 'auto' ].includes( formatValue ) ) {
		console.error( `Error: Invalid --format value "${ formatValue }". Use json, human, or auto.` );
		process.exit( 1 );
	}
	const isExplicitFormat = formatValue !== 'auto';
	const format = resolveFormat( formatValue );

	try {
		const metadata = await evaluate( {
			repoRoot,
			model: values.model,
		} );

		if ( values.output ) {
			await mkdir( dirname( values.output ), { recursive: true } );

			if ( isExplicitFormat ) {
				// Explicit --format: write that format to the file
				const output =
					format === 'human'
						? renderHumanReport( metadata, repoRoot )
						: JSON.stringify( metadata, null, 2 ) + '\n';
				await writeFile( values.output, output );
			} else {
				// Auto with --output: always write JSON to file
				await writeFile( values.output, JSON.stringify( metadata, null, 2 ) + '\n' );
				// Show human summary on TTY
				if ( process.stdout.isTTY ) {
					process.stdout.write( renderHumanReport( metadata, repoRoot ) );
				}
			}
			console.error( `Output written to ${ values.output }` );
		} else {
			// No --output: write resolved format to stdout
			const output =
				format === 'human'
					? renderHumanReport( metadata, repoRoot )
					: JSON.stringify( metadata, null, 2 ) + '\n';
			process.stdout.write( output );
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
