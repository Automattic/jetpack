#!/usr/bin/env node

/**
 * Generate Test Instructions Tool — CLI entrypoint.
 *
 * Thin orchestrator: parses args, reads the changelog, fetches PR detail via
 * `gh pr view`, then hands off to one of the pipelines in
 * ./gen-test-instructions/pipeline.mjs (loop by default, single as escape
 * hatch). Stage logic, AI prompts, rendering, HITL, sidecar writing all live
 * in the sibling directory — keep this file small and obvious.
 *
 * Usage: node gen-test-instructions.mjs [options]
 *
 * Required options: --changelog <path>, --output <file>, --version-name <name>.
 * See `gen-test-instructions.sh --help` for the full option list.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
	GITHUB_REPO,
	SUPPORTED_AI_PROVIDERS,
	SUPPORTED_PIPELINES,
	DEFAULT_MAX_REVIEWER_ITERATIONS,
} from './gen-test-instructions/constants.mjs';
import { runLoopPipeline, runSingleShotPipeline } from './gen-test-instructions/pipeline.mjs';
import { loadBaselineEvidence } from './gen-test-instructions/process-gates.mjs';
import { generateRawTestInstructions } from './gen-test-instructions/raw.mjs';
import { loadReleaseContextFile } from './gen-test-instructions/release-context.mjs';

// ============================================================================
// COMMAND LINE ARGUMENT PARSING
// ============================================================================

/**
 * Parse command line arguments into an options object.
 *
 * @return {object} Parsed options
 */
function parseArguments() {
	const args = process.argv.slice( 2 );
	const options = {
		changelog: null,
		output: null,
		versionName: null,
		sinceVersion: null,
		sinceDate: null,
		toVersion: null,
		toDate: null,
		skipAi: false,
		ai: 'claude',
		verbose: false,
		excludePrs: new Set(),
		includeOnly: null,
		nonInteractive: false,
		coverageJson: null,
		pipeline: 'loop',
		skipCoverageAi: false,
		skipReviewer: false,
		maxReviewerIterations: DEFAULT_MAX_REVIEWER_ITERATIONS,
		skipPrioritize: false,
		targetSections: null,
		headlinePrs: new Set(),
		demotePrs: new Set(),
		allowUnresolvedReview: false,
		releaseContext: null,
		baselineCoverageJson: null,
		baselineMarkdown: null,
	};

	const parseCsvIntoSet = csv =>
		new Set(
			String( csv || '' )
				.split( /[\s,]+/ )
				.map( s => parseInt( s.replace( /^#/, '' ), 10 ) )
				.filter( n => Number.isInteger( n ) )
		);

	for ( let i = 0; i < args.length; i++ ) {
		switch ( args[ i ] ) {
			case '--changelog':
				options.changelog = args[ ++i ];
				break;
			case '--output':
				options.output = args[ ++i ];
				break;
			case '--version-name':
				options.versionName = args[ ++i ];
				break;
			case '--since-version':
				options.sinceVersion = args[ ++i ];
				break;
			case '--since-date':
				options.sinceDate = args[ ++i ];
				break;
			case '--to-version':
				options.toVersion = args[ ++i ];
				break;
			case '--to-date':
				options.toDate = args[ ++i ];
				break;
			case '--skip-ai':
				options.skipAi = true;
				break;
			case '--ai':
				options.ai = args[ ++i ];
				if ( ! SUPPORTED_AI_PROVIDERS.includes( options.ai ) ) {
					throw new Error(
						`Unknown --ai provider: "${ options.ai }". Supported: ${ SUPPORTED_AI_PROVIDERS.join(
							', '
						) }.`
					);
				}
				break;
			case '--verbose':
				options.verbose = true;
				break;
			case '--exclude-prs':
				options.excludePrs = parseCsvIntoSet( args[ ++i ] );
				break;
			case '--include-only':
				options.includeOnly = parseCsvIntoSet( args[ ++i ] );
				break;
			case '--non-interactive':
				options.nonInteractive = true;
				break;
			case '--coverage-json':
				options.coverageJson = args[ ++i ];
				break;
			case '--pipeline':
				options.pipeline = args[ ++i ];
				if ( ! SUPPORTED_PIPELINES.includes( options.pipeline ) ) {
					throw new Error(
						`Unknown --pipeline: "${ options.pipeline }". Supported: ${ SUPPORTED_PIPELINES.join(
							', '
						) }.`
					);
				}
				break;
			case '--skip-coverage-ai':
				options.skipCoverageAi = true;
				break;
			case '--skip-reviewer':
				options.skipReviewer = true;
				break;
			case '--max-reviewer-iterations':
				options.maxReviewerIterations = parseInt( args[ ++i ], 10 );
				if (
					! Number.isInteger( options.maxReviewerIterations ) ||
					options.maxReviewerIterations < 1
				) {
					throw new Error( `Invalid --max-reviewer-iterations: must be a positive integer.` );
				}
				break;
			case '--skip-prioritize':
				options.skipPrioritize = true;
				break;
			case '--target-sections':
				options.targetSections = parseInt( args[ ++i ], 10 );
				if (
					! Number.isInteger( options.targetSections ) ||
					options.targetSections < 1 ||
					options.targetSections > 20
				) {
					throw new Error( `Invalid --target-sections: must be an integer in 1..20.` );
				}
				break;
			case '--headline-prs':
				options.headlinePrs = parseCsvIntoSet( args[ ++i ] );
				break;
			case '--demote-prs':
				options.demotePrs = parseCsvIntoSet( args[ ++i ] );
				break;
			case '--allow-unresolved-review':
				options.allowUnresolvedReview = true;
				break;
			case '--release-context':
				options.releaseContext = args[ ++i ];
				break;
			case '--baseline-coverage-json':
				options.baselineCoverageJson = args[ ++i ];
				break;
			case '--baseline-markdown':
				options.baselineMarkdown = args[ ++i ];
				break;
			default:
				throw new Error( `Unknown option: ${ args[ i ] }` );
		}
	}

	// Validate required options
	if ( ! options.changelog ) {
		throw new Error( 'Missing required option: --changelog' );
	}
	if ( ! options.output ) {
		throw new Error( 'Missing required option: --output' );
	}
	if ( ! options.versionName ) {
		throw new Error( 'Missing required option: --version-name' );
	}

	// Upper-bound flags require an explicit lower bound — no magic defaults.
	if ( ( options.toVersion || options.toDate ) && ! options.sinceVersion && ! options.sinceDate ) {
		throw new Error(
			'--to-version / --to-date require an explicit lower bound. Pass --since-version or --since-date too.'
		);
	}

	return options;
}

// ============================================================================
// CHANGELOG PARSING
// ============================================================================

/**
 * Parse the changelog file and extract entries within an optional version/date window.
 *
 * The changelog is organized in reverse chronological order (newest first).
 * Lower bound: sinceVersion is exclusive (entries under that version are not included);
 * sinceDate is inclusive (entries dated >= the date are included).
 * Upper bound: toVersion is inclusive (collection begins at the matching heading);
 * toDate is inclusive (collection begins at the first heading with date <= the date).
 *
 * @param {string} changelogPath - Absolute path to CHANGELOG.md
 * @param {string} sinceVersion  - Lower-bound version, exclusive (optional)
 * @param {string} sinceDate     - Lower-bound date YYYY-MM-DD, inclusive (optional)
 * @param {string} toVersion     - Upper-bound version, inclusive (optional)
 * @param {string} toDate        - Upper-bound date YYYY-MM-DD, inclusive (optional)
 * @return {object} Object with entries, startVersion, and versions array
 */
function parseChangelog( changelogPath, sinceVersion, sinceDate, toVersion, toDate ) {
	const content = fs.readFileSync( changelogPath, 'utf-8' );
	const lines = content.split( '\n' );

	const entries = [];
	const versions = [];
	let currentVersion = null;
	let currentDate = null;
	let currentSection = null;
	let collectingEntries = false;
	let lastStableVersion = null;

	const versionRegex = /^## ([\d.]+(?:-[a-z]+\.\d+)?)\s*-\s*(\d{4}-\d{2}-\d{2})/i;
	const sectionRegex = /^### (.+)/;
	const entryRegex = /^- (.+?)(?:\s+\[#\d+\])+/;
	const prNumberRegex = /\[#(\d+)\]/g;

	// First pass: collect all versions and find last stable
	for ( const line of lines ) {
		const versionMatch = line.match( versionRegex );
		if ( versionMatch ) {
			const ver = versionMatch[ 1 ];
			const date = versionMatch[ 2 ];
			versions.push( { version: ver, date } );

			// A stable version doesn't have -a., -b., -rc. suffixes
			if ( ! lastStableVersion && ! ver.match( /-[a-z]+\./i ) ) {
				lastStableVersion = ver;
			}
		}
	}

	const startVersion = sinceVersion || lastStableVersion;

	if ( ! startVersion && ! sinceDate ) {
		throw new Error( 'Could not determine last stable version. Please specify a version or date.' );
	}

	if ( sinceVersion && ! versions.find( v => v.version === sinceVersion ) ) {
		throw new Error(
			`Version "${ sinceVersion }" not found in changelog.\nAvailable versions: ${ versions
				.slice( 0, 10 )
				.map( v => v.version )
				.join( ', ' ) }...`
		);
	}
	if ( toVersion && ! versions.find( v => v.version === toVersion ) ) {
		throw new Error(
			`Version "${ toVersion }" not found in changelog.\nAvailable versions: ${ versions
				.slice( 0, 10 )
				.map( v => v.version )
				.join( ', ' ) }...`
		);
	}

	let hitUpperBound = ! ( toVersion || toDate );
	for ( const line of lines ) {
		const versionMatch = line.match( versionRegex );
		if ( versionMatch ) {
			currentVersion = versionMatch[ 1 ];
			currentDate = versionMatch[ 2 ];

			if ( ! hitUpperBound ) {
				if (
					( toVersion && currentVersion === toVersion ) ||
					( toDate && currentDate <= toDate )
				) {
					hitUpperBound = true;
				} else {
					collectingEntries = false;
					currentSection = null;
					continue;
				}
			}

			if ( startVersion && currentVersion === startVersion ) {
				collectingEntries = false;
				break;
			} else if ( sinceDate && currentDate < sinceDate ) {
				collectingEntries = false;
				break;
			} else {
				collectingEntries = true;
			}

			currentSection = null;
			continue;
		}

		const sectionMatch = line.match( sectionRegex );
		if ( sectionMatch ) {
			currentSection = sectionMatch[ 1 ];
			continue;
		}

		if ( collectingEntries && currentVersion ) {
			const entryMatch = line.match( entryRegex );
			if ( entryMatch ) {
				const text = entryMatch[ 1 ].trim();

				const prNumbers = [];
				let prMatch;
				while ( ( prMatch = prNumberRegex.exec( line ) ) !== null ) {
					prNumbers.push( prMatch[ 1 ] );
				}

				prNumbers.forEach( prNumber => {
					entries.push( {
						text,
						prNumber,
						section: currentSection,
						version: currentVersion,
						date: currentDate,
					} );
				} );
			}
		}
	}

	return {
		entries,
		startVersion: startVersion || 'date: ' + sinceDate,
		versions: versions.slice( 0, 20 ),
	};
}

/**
 * Extract unique PR numbers from changelog entries.
 *
 * @param {Array} entries - Changelog entries.
 * @return {Array} Sorted array of unique PR numbers.
 */
function extractPRNumbers( entries ) {
	const prNumbers = new Set();
	entries.forEach( entry => {
		if ( entry.prNumber ) {
			prNumbers.add( entry.prNumber );
		}
	} );
	return Array.from( prNumbers ).sort( ( a, b ) => parseInt( a ) - parseInt( b ) );
}

// ============================================================================
// GITHUB PR FETCHING
// ============================================================================

// Cap per-text-field size so reviewer/comment/commit noise can't blow up
// downstream prompts. Coverage-AI pulls from these fields directly.
const PR_TEXT_FIELD_CAP = 1000;

/**
 * Fetch PR details from GitHub using gh CLI.
 *
 * Fields fetched intentionally: number/title/body/labels/author/additions/
 * deletions/files (used by classifyPR + plan prompt) AND reviews/comments/
 * commits (used by the coverage-AI stage to catch env/account requirements
 * that aren't in the body but show up in reviewer discussion).
 *
 * @param {Array} prNumbers - Array of PR numbers to fetch.
 * @return {Promise<Array>} Array of PR detail objects.
 */
async function fetchPRDetails( prNumbers ) {
	const prDetails = [];

	for ( let i = 0; i < prNumbers.length; i++ ) {
		const prNumber = prNumbers[ i ];
		process.stdout.write( `\r  Fetching PR #${ prNumber } (${ i + 1 }/${ prNumbers.length })...` );

		try {
			const prData = execSync(
				`gh pr view ${ prNumber } --json number,title,body,labels,author,additions,deletions,files,reviews,comments,commits --repo ${ GITHUB_REPO }`,
				{ encoding: 'utf-8', stdio: [ 'pipe', 'pipe', 'ignore' ] }
			);

			const pr = JSON.parse( prData );
			const testingInstructions = extractTestingInstructions( pr.body );

			prDetails.push( {
				number: pr.number,
				title: pr.title,
				body: pr.body,
				testingInstructions,
				labels: ( pr.labels || [] ).map( l => l.name ),
				author: pr.author?.login || '',
				additions: pr.additions ?? 0,
				deletions: pr.deletions ?? 0,
				files: ( pr.files || [] ).map( f => f.path ),
				reviewTexts: ( pr.reviews || [] )
					.map( r => clip( r.body, PR_TEXT_FIELD_CAP ) )
					.filter( Boolean ),
				commentTexts: ( pr.comments || [] )
					.map( c => clip( c.body, PR_TEXT_FIELD_CAP ) )
					.filter( Boolean ),
				commitSubjects: ( pr.commits || [] ).map( c => c.messageHeadline ).filter( Boolean ),
			} );

			await sleep( 100 );
		} catch ( error ) {
			console.warn( `\n⚠️  Could not fetch PR #${ prNumber }: ${ error.message }` );
		}
	}

	process.stdout.write( '\r' + ' '.repeat( 80 ) + '\r' ); // Clear the line
	return prDetails;
}

/**
 * Trim and cap a string to `max` chars, ellipsizing if needed. Returns an
 * empty string for non-string / whitespace-only input.
 *
 * @param {string} s   - Source string.
 * @param {number} max - Maximum character length.
 * @return {string} Trimmed, possibly ellipsized string.
 */
function clip( s, max ) {
	if ( typeof s !== 'string' ) {
		return '';
	}
	const trimmed = s.trim();
	if ( ! trimmed ) {
		return '';
	}
	return trimmed.length > max ? trimmed.slice( 0, max - 1 ) + '…' : trimmed;
}

/**
 * Extract testing instructions from PR body.
 *
 * @param {string} prBody - PR description.
 * @return {string|null} Testing instructions or null.
 */
function extractTestingInstructions( prBody ) {
	if ( ! prBody ) {
		return null;
	}

	const patterns = [
		/## Testing [Ii]nstructions[\s\S]*?(?=\n## |$)/,
		/### Testing [Ii]nstructions[\s\S]*?(?=\n## |$)/,
		/## Test [Pp]lan[\s\S]*?(?=\n## |$)/,
		/### Test [Pp]lan[\s\S]*?(?=\n## |$)/,
		/## How to [Tt]est[\s\S]*?(?=\n## |$)/,
		/### How to [Tt]est[\s\S]*?(?=\n## |$)/,
	];

	for ( const pattern of patterns ) {
		const match = prBody.match( pattern );
		if ( match ) {
			return match[ 0 ].trim();
		}
	}

	return null;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Simple sleep utility.
 *
 * @param {number} ms - Milliseconds to sleep.
 * @return {Promise} Promise that resolves after ms milliseconds.
 */
function sleep( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main function that orchestrates the entire process.
 */
async function main() {
	try {
		const options = parseArguments();

		if ( options.verbose ) {
			console.log(
				'Options:',
				JSON.stringify( options, ( _k, v ) => ( v instanceof Set ? [ ...v ] : v ), 2 )
			);
		}

		// Step 1: Parse changelog
		const relativeChangelogPath = path.relative( process.cwd(), options.changelog );
		console.log( `📖 Reading changelog from: ${ relativeChangelogPath }` );

		const parseResult = parseChangelog(
			options.changelog,
			options.sinceVersion,
			options.sinceDate,
			options.toVersion,
			options.toDate
		);
		const entries = parseResult.entries;

		if ( entries.length === 0 ) {
			throw new Error( 'No changelog entries found for the specified criteria.' );
		}

		const upperBoundLabel = options.toVersion || ( options.toDate && `date: ${ options.toDate }` );
		console.log(
			`✓ Found ${ entries.length } changelog entries since version ${ parseResult.startVersion }` +
				( upperBoundLabel ? ` up to ${ upperBoundLabel }` : '' ) +
				'\n'
		);

		if ( options.verbose ) {
			console.log(
				`Available versions in changelog: ${ parseResult.versions
					.map( v => v.version )
					.join( ', ' ) }`
			);
		}

		// Step 2: Extract PR numbers
		const prNumbers = extractPRNumbers( entries );
		console.log( `🔍 Identified ${ prNumbers.length } unique PRs\n` );

		// Step 3: Fetch PR details from GitHub
		console.log( '📥 Fetching PR details from GitHub...' );
		const prDetails = await fetchPRDetails( prNumbers );
		console.log( `✓ Fetched details for ${ prDetails.length } PRs\n` );

		// Step 4: Generate test instructions
		let testInstructions;
		let publishable = true;

		if ( options.skipAi ) {
			testInstructions = generateRawTestInstructions( entries, prDetails );
		} else {
			const aiLabel = options.ai === 'codex' ? '`codex exec`' : '`claude -p`';
			console.log(
				`🤖 Consolidating test instructions via ${ aiLabel } for Jetpack ${ options.versionName } (pipeline: ${ options.pipeline })...`
			);
			const coverageJsonPath = options.coverageJson || `${ options.output }.coverage.json`;
			const releaseContext = loadReleaseContextFile( options.releaseContext );
			const baselineClassifications = loadBaselineEvidence( {
				coverageJsonPath: options.baselineCoverageJson,
				markdownPath: options.baselineMarkdown,
			} );
			const pipelineOptions = {
				excludePrs: options.excludePrs,
				includeOnly: options.includeOnly,
				nonInteractive: options.nonInteractive,
				coverageJsonPath,
				skipCoverageAi: options.skipCoverageAi,
				skipReviewer: options.skipReviewer,
				maxReviewerIterations: options.maxReviewerIterations,
				skipPrioritize: options.skipPrioritize,
				targetSections: options.targetSections,
				headlinePrs: options.headlinePrs,
				demotePrs: options.demotePrs,
				allowUnresolvedReview: options.allowUnresolvedReview,
				releaseContext,
				baselineClassifications,
			};

			const pipeline = options.pipeline === 'single' ? runSingleShotPipeline : runLoopPipeline;
			const result = await pipeline(
				entries,
				prDetails,
				options.versionName,
				options.ai,
				pipelineOptions
			);
			testInstructions = result.markdown;
			publishable = result.publishable !== false;
		}

		// Step 5: Write to file
		fs.writeFileSync( options.output, testInstructions );
		if ( ! publishable && ! options.allowUnresolvedReview ) {
			console.error(
				'\n❌ Generated guide has unresolved process gates and is marked non-publishable.'
			);
			process.exitCode = 2;
		}
	} catch ( error ) {
		console.error( `\n❌ Error: ${ error.message }` );
		process.exit( 1 );
	}
}

main();
