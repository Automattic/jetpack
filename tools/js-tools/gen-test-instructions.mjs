#!/usr/bin/env node

/**
 * Generate Test Instructions Tool
 *
 * This tool automates the generation of test instructions for Jetpack releases by:
 * 1. Parsing the CHANGELOG.md to extract entries since a specified version
 * 2. Fetching PR details from GitHub using the gh CLI
 * 3. Extracting testing instructions from PR descriptions
 * 4. Optionally consolidating instructions via the local `claude` CLI (Claude Code)
 * 5. Generating a markdown document with all PR numbers as clickable links
 *
 * Usage: node gen-test-instructions.mjs [options]
 *
 * Required Options:
 * --changelog <path>    Path to CHANGELOG.md file
 * --output <file>       Output file path for generated test instructions
 *
 * Optional:
 * --since-version <ver> Start from this version (e.g., 15.1). Defaults to last stable release
 * --since-date <date>   Include entries since this date (YYYY-MM-DD format)
 * --to-version <ver>    Stop at this version (inclusive). Caps the upper end of the range.
 * --to-date <date>      Include entries up to this date (YYYY-MM-DD, inclusive)
 * --skip-ai             Skip AI consolidation and output raw format
 * --verbose             Enable verbose output for debugging
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const GITHUB_REPO = 'Automattic/jetpack';
const CLAUDE_MODEL = 'claude-opus-4-7[1m]';
const CLAUDE_EFFORT = 'xhigh';
const CODEX_MODEL = 'gpt-5.5';
const CODEX_EFFORT = 'xhigh';
const SUPPORTED_AI_PROVIDERS = [ 'claude', 'codex' ];

// Canonical "Before you start" preamble — kept in sync with the in-repo to-test.md
// of the most recent release (currently 15.8). Emitted verbatim by the renderer so
// the AI never has to regenerate it.
const BEFORE_YOU_START = `- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your \`wp-config.php\` file to include: \`define( 'JETPACK_BLOCKS_VARIATION', 'beta' );\`
  - Or add the following to something like a code snippet plugin: \`add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );\``;

// Tester-environment classifiers. Keyword lists are case-insensitive substring matches
// against a PR's testing instructions; a single hit promotes the PR into the relevant bucket.
const ENGINEER_KEYWORDS = [
	{
		label: 'WPCOM sandbox + wpsh',
		patterns: [ 'wpcom sandbox', 'sandboxed wp.com', 'wpcom-sandbox', 'wpsh ' ],
	},
	{
		label: 'Jetpack rsync / WoA dev pool',
		patterns: [ 'jetpack rsync', 'dev pool', 'woa dev', 'pressable-staging' ],
	},
	{
		label: 'Gutenberg experiment flag',
		patterns: [ 'gutenberg experiment', 'experimental flag', 'workflow palette experiment' ],
	},
];

const EXTERNAL_ACCOUNT_KEYWORDS = [
	{ account: 'Stripe', patterns: [ 'stripe account', 'stripe connect', 'stripe api' ] },
	{ account: 'MailPoet', patterns: [ 'mailpoet account', 'mailpoet subscription' ] },
	{
		account: 'PayPal pro',
		patterns: [ 'paypal account', 'professional paypal', 'paypal business' ],
	},
	{ account: 'Mailchimp', patterns: [ 'mailchimp account' ] },
	{ account: 'OpenTable', patterns: [ 'opentable account' ] },
	{ account: 'Nextdoor', patterns: [ 'nextdoor account' ] },
	{ account: 'Discord webhook', patterns: [ 'discord webhook' ] },
	{ account: 'LinkedIn connection', patterns: [ 'linkedin connection', 'linkedin account' ] },
];

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
		sinceVersion: null,
		sinceDate: null,
		toVersion: null,
		toDate: null,
		skipAi: false,
		ai: 'claude',
		verbose: false,
	};

	for ( let i = 0; i < args.length; i++ ) {
		switch ( args[ i ] ) {
			case '--changelog':
				options.changelog = args[ ++i ];
				break;
			case '--output':
				options.output = args[ ++i ];
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

	// Regular expressions for matching changelog format
	const versionRegex = /^## ([\d.]+(?:-[a-z]+\.\d+)?)\s*-\s*(\d{4}-\d{2}-\d{2})/i;
	const sectionRegex = /^### (.+)/;
	// Match the entry text and extract all PR numbers (handles single or multiple PRs)
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

	// Determine the version to start from
	const startVersion = sinceVersion || lastStableVersion;

	if ( ! startVersion && ! sinceDate ) {
		throw new Error( 'Could not determine last stable version. Please specify a version or date.' );
	}

	// Validate that the specified version exists
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

	// Second pass: collect entries (changelog is reverse chronological)
	// We walk top → bottom. If an upper bound is set, skip headings until we hit it.
	// Then collect entries until we cross the lower bound.
	// Example: --since-version 15.0 --to-version 15.1 collects 15.1 and any 15.1-a.x / 15.0.x
	// entries listed above 15.0 but skips 15.2+ at the top.
	let hitUpperBound = ! ( toVersion || toDate );
	for ( const line of lines ) {
		const versionMatch = line.match( versionRegex );
		if ( versionMatch ) {
			currentVersion = versionMatch[ 1 ];
			currentDate = versionMatch[ 2 ];

			// Upper bound: skip headings that are newer than the cap.
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

			// Lower bound: stop when we reach the cutoff version (entries AFTER this version, not including it)
			if ( startVersion && currentVersion === startVersion ) {
				collectingEntries = false;
				break;
			} else if ( sinceDate && currentDate < sinceDate ) {
				collectingEntries = false;
				break;
			} else {
				// We're inside the window, so collect entries
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

				// Extract all PR numbers from the line (handles single or multiple PRs)
				const prNumbers = [];
				let prMatch;
				while ( ( prMatch = prNumberRegex.exec( line ) ) !== null ) {
					prNumbers.push( prMatch[ 1 ] );
				}

				// Create an entry for each PR number
				// This allows us to fetch details for all related PRs
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
 * @param {Array} entries - Changelog entries
 * @return {Array} Sorted array of unique PR numbers
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

/**
 * Fetch PR details from GitHub using gh CLI.
 *
 * @param {Array} prNumbers - Array of PR numbers to fetch
 * @return {Promise<Array>} Array of PR detail objects
 */
async function fetchPRDetails( prNumbers ) {
	const prDetails = [];

	for ( let i = 0; i < prNumbers.length; i++ ) {
		const prNumber = prNumbers[ i ];
		process.stdout.write( `\r  Fetching PR #${ prNumber } (${ i + 1 }/${ prNumbers.length })...` );

		try {
			const prData = execSync(
				`gh pr view ${ prNumber } --json number,title,body,labels,author --repo ${ GITHUB_REPO }`,
				{ encoding: 'utf-8', stdio: [ 'pipe', 'pipe', 'ignore' ] }
			);

			const pr = JSON.parse( prData );
			const testingInstructions = extractTestingInstructions( pr.body );

			prDetails.push( {
				number: pr.number,
				title: pr.title,
				body: pr.body,
				testingInstructions,
				labels: pr.labels.map( l => l.name ),
				author: pr.author.login,
			} );

			// Small delay to avoid rate limiting
			await sleep( 100 );
		} catch ( error ) {
			console.warn( `\n⚠️  Could not fetch PR #${ prNumber }: ${ error.message }` );
		}
	}

	process.stdout.write( '\r' + ' '.repeat( 80 ) + '\r' ); // Clear the line
	return prDetails;
}

/**
 * Extract testing instructions from PR body.
 *
 * @param {string} prBody - PR description
 * @return {string|null} Testing instructions or null
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
// PR NUMBER LINKING
// ============================================================================

/**
 * Convert PR number references to clickable GitHub links.
 *
 * @param {string} text - Text containing PR references
 * @return {string} Text with PR numbers converted to links
 */
function convertPRNumbersToLinks( text ) {
	// Pattern 1: [#12345] (not already a link) -> [#12345](url)
	text = text.replace( /\[#(\d+)\](?!\()/g, ( _match, prNum ) => {
		return `[#${ prNum }](https://github.com/${ GITHUB_REPO }/pull/${ prNum })`;
	} );

	// Pattern 2: PR #12345 at word boundaries -> PR [#12345](url)
	text = text.replace( /(?<!\[)(?<!\()PR #(\d+)\b/g, ( _match, prNum ) => {
		return `PR [#${ prNum }](https://github.com/${ GITHUB_REPO }/pull/${ prNum })`;
	} );

	// Pattern 3: Standalone #12345 (4+ digits, not headings) -> [#12345](url)
	text = text.replace( /(?<!\[)(?<!#)(?<!\()(?<!\/)#(\d{4,})\b/g, ( _match, prNum ) => {
		return `[#${ prNum }](https://github.com/${ GITHUB_REPO }/pull/${ prNum })`;
	} );

	return text;
}

// ============================================================================
// OUTPUT GENERATION - RAW MODE
// ============================================================================

/**
 * Generate raw (non-AI) test instructions output.
 *
 * @param {Array} entries   - Changelog entries
 * @param {Array} prDetails - PR details with testing instructions
 * @return {string} Markdown formatted test instructions
 */
function generateRawTestInstructions( entries, prDetails ) {
	let output = '# Test Instructions\n\n';
	output += `Generated on: ${ new Date().toISOString().split( 'T' )[ 0 ] }\n\n`;
	output += '## Overview\n\n';
	output +=
		'This document contains testing instructions for changes in the current release cycle.\n\n';

	// Group PRs by section
	const prsBySection = {};
	const prMap = new Map( prDetails.map( pr => [ pr.number.toString(), pr ] ) );

	entries.forEach( entry => {
		const section = entry.section || 'Other';
		if ( ! prsBySection[ section ] ) {
			prsBySection[ section ] = [];
		}

		const pr = prMap.get( entry.prNumber );
		if ( pr && ! prsBySection[ section ].some( p => p.number.toString() === entry.prNumber ) ) {
			prsBySection[ section ].push( pr );
		}
	} );

	// Output each section
	Object.keys( prsBySection )
		.sort()
		.forEach( section => {
			output += `## ${ section }\n\n`;

			prsBySection[ section ].forEach( pr => {
				// Make the PR title a clickable link
				output += `### [${ pr.title }](https://github.com/${ GITHUB_REPO }/pull/${ pr.number }) (#${ pr.number })\n\n`;

				if ( pr.testingInstructions ) {
					// We have explicit testing instructions
					const linkedInstructions = convertPRNumbersToLinks( pr.testingInstructions );
					output += `${ linkedInstructions }\n\n`;
				} else if ( pr.body ) {
					// No explicit testing instructions, include full PR description for context
					output +=
						'_No specific testing instructions section found. Full PR description below:_\n\n';
					const linkedBody = convertPRNumbersToLinks( pr.body );
					output += `${ linkedBody }\n\n`;
				} else {
					// No PR description at all
					output += '_No testing instructions or PR description available._\n\n';
				}

				output += '---\n\n';
			} );
		} );

	return output;
}

// ============================================================================
// OUTPUT GENERATION - AI CONSOLIDATED MODE
// ============================================================================

/**
 * Classify a PR's testing-instructions text for tester-environment requirements.
 * Returns the first matched engineer-environment label (if any) and a deduped list of
 * named external accounts the tester would need.
 *
 * @param {string} testingInstructions - PR testing instructions text (may be empty/null).
 * @return {{ engineer_environment: string|null, external_accounts: string[] }} Engineer-environment
 * label (null if any tester can run the PR) and a deduped list of named external accounts.
 */
function classifyEnvironmentRequirements( testingInstructions ) {
	const text = ( testingInstructions || '' ).toLowerCase();
	if ( ! text ) {
		return { engineer_environment: null, external_accounts: [] };
	}

	let engineer = null;
	for ( const bucket of ENGINEER_KEYWORDS ) {
		if ( bucket.patterns.some( p => text.includes( p ) ) ) {
			engineer = bucket.label;
			break;
		}
	}

	const accounts = [];
	for ( const bucket of EXTERNAL_ACCOUNT_KEYWORDS ) {
		if (
			bucket.patterns.some( p => text.includes( p ) ) &&
			! accounts.includes( bucket.account )
		) {
			accounts.push( bucket.account );
		}
	}

	return { engineer_environment: engineer, external_accounts: accounts };
}

/**
 * Render the AI-produced JSON guide into the deterministic Markdown shape.
 *
 * The renderer owns the structure: section ordering (engineer-only sections last),
 * label names (Related PRs / Prereqs / Skip if / External accounts needed / Expected),
 * and the canonical Before-you-start preamble. The AI only owns the contents
 * (sections, steps, action+expected text).
 *
 * @param {object} guide          - Parsed JSON object from the AI.
 * @param {string} releaseVersion - Version label for headers (e.g. "15.8").
 * @param {number} prCount        - Total PRs fetched (for the metadata header).
 * @return {string} Markdown document.
 */
function renderGuide( guide, releaseVersion, prCount ) {
	const prLink = n => `[#${ n }](https://github.com/${ GITHUB_REPO }/pull/${ n })`;
	const today = new Date().toISOString().split( 'T' )[ 0 ];
	const out = [];

	out.push( `## Test Instructions for Jetpack ${ releaseVersion }` );
	out.push( '' );
	out.push( `Generated on: ${ today }` );
	out.push( `Total PRs: ${ prCount }` );
	out.push( '' );
	out.push( '---' );
	out.push( '' );
	out.push( `### Jetpack ${ releaseVersion } Testing Guide` );
	out.push( '' );
	out.push( '### Before you start' );
	out.push( '' );
	out.push( BEFORE_YOU_START );
	out.push( '' );

	// Summary
	out.push( '### Summary' );
	out.push( '' );
	const summary = Array.isArray( guide.summary ) ? guide.summary : [];
	if ( summary.length === 0 ) {
		out.push( '_No summary items produced._' );
	} else {
		for ( const item of summary ) {
			const topic = item.topic || '(untitled)';
			const oneLine = item.one_line || '';
			const pr = item.primary_pr ? ` (${ prLink( item.primary_pr ) })` : '';
			out.push( `- **${ topic }**${ pr } — ${ oneLine }` );
		}
	}
	out.push( '' );

	// Sections: tester-runnable first, engineer-only last. Preserve order within each group.
	const sections = Array.isArray( guide.sections ) ? guide.sections : [];
	const testerSections = sections.filter( s => ! s.engineer_environment );
	const engineerSections = sections.filter( s => s.engineer_environment );
	for ( const section of [ ...testerSections, ...engineerSections ] ) {
		out.push( `### ${ section.title || '(untitled section)' }` );
		out.push( '' );

		const relatedPrs = Array.isArray( section.related_prs ) ? section.related_prs : [];
		if ( relatedPrs.length > 0 ) {
			out.push( `**Related PRs:** ${ relatedPrs.map( prLink ).join( ', ' ) }` );
		}

		const prereqs = Array.isArray( section.prereqs ) ? section.prereqs : [];
		if ( prereqs.length > 0 ) {
			out.push( `**Prereqs:** ${ prereqs.join( ', ' ) }` );
		}

		if ( section.engineer_environment ) {
			out.push( `**Skip if:** you don't have ${ section.engineer_environment }` );
		}

		const accounts = Array.isArray( section.external_accounts ) ? section.external_accounts : [];
		if ( accounts.length > 0 ) {
			out.push( `**External accounts needed:** ${ accounts.join( ', ' ) }` );
		}

		out.push( '' );

		const steps = Array.isArray( section.steps ) ? section.steps : [];
		if ( steps.length === 0 ) {
			out.push( '_No actionable steps produced for this section._' );
			out.push( '' );
			continue;
		}
		for ( let i = 0; i < steps.length; i++ ) {
			const action = steps[ i ].action || '(missing action)';
			const expected = steps[ i ].expected || 'no console errors, no PHP notices';
			out.push( `${ i + 1 }. ${ action }` );
			out.push( `   Expected: ${ expected }` );
		}
		out.push( '' );
	}

	// Other changes
	out.push( '### Other changes without specific test instructions' );
	out.push( '' );
	const other = Array.isArray( guide.other_changes ) ? guide.other_changes : [];
	if ( other.length === 0 ) {
		out.push( '_None._' );
	} else {
		for ( const c of other ) {
			const pr = c.pr ? prLink( c.pr ) : '(no PR)';
			const title = c.title ? `${ c.title }` : '';
			const oneLine = c.one_line ? `: ${ c.one_line }` : '';
			out.push( `- ${ pr } — ${ title }${ oneLine }` );
		}
	}
	out.push( '' );

	return out.join( '\n' );
}

/**
 * Generate AI-consolidated test instructions by shelling out to a local AI CLI.
 *
 * @param {Array}  entries        - Changelog entries
 * @param {Array}  prDetails      - PR details with testing instructions
 * @param {string} releaseVersion - Release version being tested (used in headers)
 * @param {string} ai             - AI provider to use ('claude' or 'codex')
 * @return {Promise<string>} Markdown formatted consolidated test instructions
 */
async function generateAIConsolidatedInstructions(
	entries,
	prDetails,
	releaseVersion,
	ai = 'claude'
) {
	// Prepare data for AI processing. Each PR gets pre-classified for environment
	// requirements so the AI doesn't have to re-infer them from free-form text.
	const prMap = new Map( prDetails.map( pr => [ pr.number.toString(), pr ] ) );
	const prsBySection = {};

	entries.forEach( entry => {
		const section = entry.section || 'Other';
		if ( ! prsBySection[ section ] ) {
			prsBySection[ section ] = [];
		}

		const pr = prMap.get( entry.prNumber );
		if ( pr && ! prsBySection[ section ].some( p => p.number.toString() === entry.prNumber ) ) {
			const classified = classifyEnvironmentRequirements( pr.testingInstructions );
			prsBySection[ section ].push( {
				number: pr.number,
				title: pr.title,
				changelogText: entry.text,
				testingInstructions: pr.testingInstructions || 'No testing instructions provided.',
				engineer_environment: classified.engineer_environment,
				external_accounts: classified.external_accounts,
			} );
		}
	} );

	const labelForRelease = releaseVersion || 'upcoming release';
	const prompt = buildConsolidationPrompt( prsBySection, labelForRelease );
	const runner = ai === 'codex' ? runCodexCli : runClaudeCli;

	let parsedGuide = null;
	let lastError = null;
	for ( let attempt = 1; attempt <= 2 && ! parsedGuide; attempt++ ) {
		try {
			const promptForAttempt =
				attempt === 1
					? prompt
					: prompt +
					  '\n\nIMPORTANT: your previous response was not valid JSON. Return ONLY the JSON object — no Markdown, no code fences, no preamble, no trailing prose.';
			const raw = await runner( promptForAttempt );
			parsedGuide = parseGuideJson( raw );
			if ( ! parsedGuide ) {
				lastError = new Error( 'AI response was not valid JSON' );
				if ( attempt === 1 ) {
					console.warn( '\n⚠️  AI response not valid JSON; retrying once.\n' );
				}
			}
		} catch ( error ) {
			lastError = error;
			break;
		}
	}

	if ( ! parsedGuide ) {
		console.warn(
			`\n⚠️  AI consolidation failed: ${
				lastError ? lastError.message : 'unknown error'
			}. Falling back to raw output.\n`
		);
		return generateRawTestInstructions( entries, prDetails );
	}

	return renderGuide( parsedGuide, labelForRelease, prDetails.length );
}

/**
 * Build the prompt that asks the AI to return a JSON consolidation of the testing guide.
 *
 * @param {object} prsBySection - PRs grouped by changelog section, pre-classified.
 * @param {string} releaseLabel - Human-readable release version (e.g. "15.8").
 * @return {string} Prompt text to send to the AI.
 */
function buildConsolidationPrompt( prsBySection, releaseLabel ) {
	return `You are producing a consolidated testing guide for Jetpack plugin release ${ releaseLabel }.

Return ONLY a single JSON object matching this exact schema. No Markdown, no code fences, no preamble, no trailing prose:

{
  "version": "${ releaseLabel }",
  "summary": [
    { "topic": "<short topic name>", "one_line": "<one-sentence reason this matters to a tester>", "primary_pr": <int PR number> }
  ],
  "sections": [
    {
      "title": "<feature area name>",
      "related_prs": [<int>, <int>, ...],
      "prereqs": ["<concrete setup the tester needs before this section>"],
      "external_accounts": ["<service name, e.g. Stripe, PayPal pro, MailPoet>"],
      "engineer_environment": "<short label like 'wpcom sandbox + wpsh' OR null if any tester can run this>",
      "steps": [
        { "action": "<imperative action the tester takes>", "expected": "<observable outcome the tester verifies>" }
      ]
    }
  ],
  "other_changes": [
    { "pr": <int>, "title": "<PR title>", "one_line": "<why no actionable test is needed>" }
  ]
}

Rules for the content you generate:

1. PR numbers are integers (no "#", no link wrapping). The renderer formats them as links.
2. Group related PRs into a single section. Consolidate overlapping or redundant steps. Sections should reflect tester-facing surfaces (e.g. "Forms dashboard", "Jetpack Connector", "Social editor sidebar") — not GitHub project names.
3. Every step must have a non-empty "action" AND a non-empty "expected". Action is what the tester does; expected is what they should observe. If a PR's testing instructions have no clear outcome, write a minimal expected line like "no console errors, no PHP notices".
4. Forbidden phrases — rewrite them into action+expected pairs: "smoke test", "test thoroughly", "verify it works", "should be properly applied", "as expected", "make sure everything works", "exploratory testing". A tester reading these gets no signal about what counts as a pass.
5. Use the engineer_environment and external_accounts values that the input PR objects already carry. Aggregate per section: if any PR in the section requires engineer_environment, set the section's engineer_environment to that label. For external_accounts, union the per-PR arrays. Use null (not the string "null") when no engineer environment is needed; use [] when no external accounts are needed.
6. The prereqs array lists what the tester needs set up BEFORE running the steps in this section (a specific block enabled, a connected Stripe account, a specific theme, etc.). Be concrete. Do not list cross-cutting prereqs that apply to all sections (JS console, Debug Bar, beta-block flag) — those are handled by the renderer.
7. Other_changes lists PRs that genuinely have no actionable tester-facing test (internal refactors, dependency bumps, PHP hardening, CI-only). Do NOT dump PRs you couldn't think of steps for — only PRs whose changelog text and PR body confirm no UI surface to exercise.
8. Order sections by tester-perceived risk (UI-visible changes first; security fixes and refactors lower). The renderer will move engineer_environment sections to the end automatically.
9. Every PR number from the input must appear exactly once across sections + other_changes. Do not drop PRs.

Here is the source data (sections → PRs with their testing instructions and pre-classified environment tags):

${ JSON.stringify( prsBySection, null, 2 ) }

Output the JSON object directly to stdout. Do not save it to a file, do not announce what you did, do not wrap it in code fences. Begin your response with the literal character "{" and end it with "}".`;
}

/**
 * Try to parse a model response as the consolidation JSON object.
 * Tolerates stray code fences and leading/trailing prose by scanning for the first balanced JSON object.
 *
 * @param {string} raw - Raw text from the AI CLI.
 * @return {object|null} Parsed guide object or null on failure.
 */
function parseGuideJson( raw ) {
	if ( ! raw || typeof raw !== 'string' ) {
		return null;
	}
	let text = raw.trim();

	// Strip a fenced code block if the model wrapped it despite instructions.
	const fenceMatch = text.match( /^```(?:json)?\s*([\s\S]*?)\s*```$/i );
	if ( fenceMatch ) {
		text = fenceMatch[ 1 ].trim();
	}

	const firstBrace = text.indexOf( '{' );
	const lastBrace = text.lastIndexOf( '}' );
	if ( firstBrace < 0 || lastBrace <= firstBrace ) {
		return null;
	}
	const candidate = text.slice( firstBrace, lastBrace + 1 );

	try {
		const parsed = JSON.parse( candidate );
		if ( typeof parsed !== 'object' || parsed === null ) {
			return null;
		}
		// Soft-validate top-level shape — warn but don't fail on missing optional fields.
		if ( ! Array.isArray( parsed.sections ) ) {
			console.warn( '⚠️  Parsed JSON has no `sections` array.' );
		}
		return parsed;
	} catch {
		return null;
	}
}

/**
 * Truncate a string to `max` chars with an ellipsis. Newlines collapsed for one-line display.
 *
 * @param {string} s   - Source string.
 * @param {number} max - Maximum character count.
 * @return {string} Single-line, ellipsized string.
 */
function oneLineSummary( s, max ) {
	const flat = String( s ).replace( /\s+/g, ' ' ).trim();
	return flat.length > max ? flat.slice( 0, max - 1 ) + '…' : flat;
}

/**
 * Format a tool_use block's input as a short, single-line preview.
 *
 * @param {object} input - The tool_use input object.
 * @return {string} Short preview string.
 */
function summarizeToolInput( input ) {
	if ( ! input || typeof input !== 'object' ) {
		return '';
	}
	// Prefer common single-field tools (Bash command, Read file_path, etc.)
	const preferredKeys = [
		'command',
		'file_path',
		'path',
		'query',
		'pattern',
		'url',
		'description',
	];
	for ( const key of preferredKeys ) {
		if ( typeof input[ key ] === 'string' && input[ key ] ) {
			return `${ key }: ${ oneLineSummary( input[ key ], 100 ) }`;
		}
	}
	return oneLineSummary( JSON.stringify( input ), 100 );
}

/**
 * Print an interesting stream-json event to stderr so the user can see the agent working.
 * Returns the final text if this event is the terminal `result` event, otherwise null.
 *
 * @param {object} event - Parsed JSONL event from `claude -p --output-format stream-json`.
 * @return {string|null} Final text when the result event is seen, otherwise null.
 */
function handleStreamEvent( event ) {
	if ( ! event || typeof event !== 'object' ) {
		return null;
	}
	switch ( event.type ) {
		case 'assistant': {
			const blocks =
				event.message && Array.isArray( event.message.content ) ? event.message.content : [];
			for ( const block of blocks ) {
				if ( block.type === 'thinking' ) {
					// In stream-json the verbatim thinking is encrypted (only `signature` is exposed),
					// so block.thinking is typically an empty string. Show a marker either way.
					const preview = oneLineSummary( block.thinking || '', 140 );
					console.error( preview ? `   💭 ${ preview }` : '   💭 (extended thinking)' );
				} else if ( block.type === 'redacted_thinking' ) {
					console.error( '   💭 [redacted]' );
				} else if ( block.type === 'tool_use' ) {
					console.error( `   🔧 ${ block.name }(${ summarizeToolInput( block.input ) })` );
				}
			}
			return null;
		}
		case 'user': {
			const blocks =
				event.message && Array.isArray( event.message.content ) ? event.message.content : [];
			for ( const block of blocks ) {
				if ( block.type === 'tool_result' ) {
					const content =
						typeof block.content === 'string'
							? block.content
							: JSON.stringify( block.content || '' );
					console.error( `   📦 tool result (${ content.length } chars)` );
				}
			}
			return null;
		}
		case 'result':
			return typeof event.result === 'string' ? event.result : null;
		default:
			return null;
	}
}

/**
 * Run the local `claude -p` CLI with the given prompt piped over stdin.
 *
 * Uses stream-json output so we can surface the agent's thinking and tool calls in
 * real time to stderr while still capturing the final consolidated text on stdout.
 *
 * @param {string} prompt - The full prompt text to send to Claude.
 * @return {Promise<string>} The trimmed text response printed by the CLI.
 */
function runClaudeCli( prompt ) {
	return new Promise( ( resolve, reject ) => {
		// Run claude from os.tmpdir() so the subprocess doesn't pick up the project's
		// CLAUDE.md / .claude/ directory. Without this, project-installed skills can
		// trigger Claude to use the Write tool and dump output to a file in the repo
		// rather than print it to stdout — turning this pipeline into a no-op.
		const child = spawn(
			'claude',
			[
				'-p',
				'--model',
				CLAUDE_MODEL,
				'--effort',
				CLAUDE_EFFORT,
				'--output-format',
				'stream-json',
				'--verbose',
			],
			{ stdio: [ 'pipe', 'pipe', 'pipe' ], cwd: os.tmpdir() }
		);

		let stdoutBuffer = '';
		let stderr = '';
		const textChunks = [];
		let finalResult = null;

		child.stdout.on( 'data', chunk => {
			stdoutBuffer += chunk.toString();
			let newlineIndex;
			while ( ( newlineIndex = stdoutBuffer.indexOf( '\n' ) ) >= 0 ) {
				const line = stdoutBuffer.slice( 0, newlineIndex );
				stdoutBuffer = stdoutBuffer.slice( newlineIndex + 1 );
				if ( ! line.trim() ) {
					continue;
				}
				let event;
				try {
					event = JSON.parse( line );
				} catch {
					continue; // Ignore malformed lines defensively.
				}
				// Capture text blocks as a fallback in case no terminal `result` event arrives.
				if (
					event.type === 'assistant' &&
					event.message &&
					Array.isArray( event.message.content )
				) {
					for ( const block of event.message.content ) {
						if ( block.type === 'text' && typeof block.text === 'string' ) {
							textChunks.push( block.text );
						}
					}
				}
				const resultText = handleStreamEvent( event );
				if ( resultText !== null ) {
					finalResult = resultText;
				}
			}
		} );
		child.stderr.on( 'data', chunk => ( stderr += chunk.toString() ) );

		child.on( 'error', err => {
			if ( err.code === 'ENOENT' ) {
				reject(
					new Error(
						'`claude` CLI not found. Install Claude Code: https://docs.claude.com/en/docs/claude-code'
					)
				);
				return;
			}
			reject( err );
		} );

		child.on( 'close', code => {
			if ( code !== 0 ) {
				reject(
					new Error( `claude exited with code ${ code }${ stderr ? `: ${ stderr.trim() }` : '' }` )
				);
				return;
			}
			const finalText = finalResult !== null ? finalResult : textChunks.join( '' );
			resolve( finalText.trim() );
		} );

		child.stdin.write( prompt );
		child.stdin.end();
	} );
}

/**
 * Print an interesting codex JSONL event to stderr so the user can see the agent working.
 * Returns the assistant's text when a final `agent_message` item arrives, otherwise null.
 *
 * @param {object} event - Parsed JSONL event from `codex exec --json`.
 * @return {string|null} The agent message text when seen, otherwise null.
 */
function handleCodexStreamEvent( event ) {
	if ( ! event || typeof event !== 'object' ) {
		return null;
	}
	switch ( event.type ) {
		case 'item.completed': {
			const item = event.item || {};
			switch ( item.type ) {
				case 'agent_message':
					return typeof item.text === 'string' ? item.text : null;
				case 'reasoning': {
					const preview = oneLineSummary( item.text || item.summary || '', 140 );
					console.error( preview ? `   💭 ${ preview }` : '   💭 (reasoning)' );
					return null;
				}
				case 'command_execution': {
					const cmd = oneLineSummary( item.command || item.text || '', 100 );
					console.error( `   🔧 command(${ cmd })` );
					return null;
				}
				case 'file_change': {
					const filePath = item.path || item.file_path || '';
					console.error( `   ✏️  file_change(${ oneLineSummary( filePath, 100 ) })` );
					return null;
				}
				default:
					console.error( `   • ${ item.type }` );
					return null;
			}
		}
		case 'error':
		case 'turn.failed':
			// Surface error message; the close handler will reject the promise.
			console.error(
				`   ⚠️  ${ oneLineSummary( event.message || JSON.stringify( event ), 200 ) }`
			);
			return null;
		default:
			return null;
	}
}

/**
 * Run the local `codex exec` CLI with the given prompt piped over stdin.
 *
 * Uses --json output so we can surface the agent's reasoning and tool calls in
 * real time to stderr while still capturing the final agent message on stdout.
 *
 * @param {string} prompt - The full prompt text to send to Codex.
 * @return {Promise<string>} The trimmed text response printed by the CLI.
 */
function runCodexCli( prompt ) {
	return new Promise( ( resolve, reject ) => {
		// Same rationale as runClaudeCli: tmpdir prevents project context from leaking in.
		// codex refuses to run outside a trusted git repo by default, so we also pass
		// --skip-git-repo-check; this is safe because the prompt is fully self-contained.
		const child = spawn(
			'codex',
			[
				'exec',
				'--json',
				'--skip-git-repo-check',
				'--sandbox',
				'read-only',
				'-c',
				`model=${ CODEX_MODEL }`,
				'-c',
				`model_reasoning_effort=${ CODEX_EFFORT }`,
			],
			{ stdio: [ 'pipe', 'pipe', 'pipe' ], cwd: os.tmpdir() }
		);

		let stdoutBuffer = '';
		let stderr = '';
		const messageChunks = [];
		let finalResult = null;
		let failureMessage = null;

		child.stdout.on( 'data', chunk => {
			stdoutBuffer += chunk.toString();
			let newlineIndex;
			while ( ( newlineIndex = stdoutBuffer.indexOf( '\n' ) ) >= 0 ) {
				const line = stdoutBuffer.slice( 0, newlineIndex );
				stdoutBuffer = stdoutBuffer.slice( newlineIndex + 1 );
				if ( ! line.trim() ) {
					continue;
				}
				let event;
				try {
					event = JSON.parse( line );
				} catch {
					continue; // Ignore malformed lines defensively.
				}
				if ( event.type === 'error' || event.type === 'turn.failed' ) {
					failureMessage =
						typeof event.message === 'string'
							? event.message
							: JSON.stringify( event.error || event );
				}
				const messageText = handleCodexStreamEvent( event );
				if ( messageText !== null ) {
					messageChunks.push( messageText );
					finalResult = messageText;
				}
			}
		} );
		child.stderr.on( 'data', chunk => ( stderr += chunk.toString() ) );

		child.on( 'error', err => {
			if ( err.code === 'ENOENT' ) {
				reject(
					new Error( '`codex` CLI not found. Install Codex: https://github.com/openai/codex' )
				);
				return;
			}
			reject( err );
		} );

		child.on( 'close', code => {
			if ( failureMessage ) {
				reject( new Error( `codex turn failed: ${ failureMessage }` ) );
				return;
			}
			if ( code !== 0 ) {
				reject(
					new Error( `codex exited with code ${ code }${ stderr ? `: ${ stderr.trim() }` : '' }` )
				);
				return;
			}
			const finalText = finalResult !== null ? finalResult : messageChunks.join( '' );
			resolve( finalText.trim() );
		} );

		child.stdin.write( prompt );
		child.stdin.end();
	} );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Simple sleep utility.
 *
 * @param {number} ms - Milliseconds to sleep
 * @return {Promise} Promise that resolves after ms milliseconds
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
		// Parse command line arguments
		const options = parseArguments();

		console.log( '🧪 Generating Test Instructions Guide...\n' );

		if ( options.verbose ) {
			console.log( 'Options:', JSON.stringify( options, null, 2 ) );
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

		if ( options.skipAi ) {
			testInstructions = generateRawTestInstructions( entries, prDetails );
		} else {
			// Pick the version label that the rendered guide will use in its headers.
			// Priority: explicit --to-version > newest version covered by entries > --since-version > startVersion.
			// `entries` is in document order (newest first) because parseChangelog walks the
			// reverse-chronological CHANGELOG top-down, so `entries[0].version` is the upper end
			// of the selected range — i.e., the release whose PRs we're actually testing.
			const releaseVersion =
				options.toVersion ||
				( entries[ 0 ] && entries[ 0 ].version ) ||
				options.sinceVersion ||
				parseResult.startVersion;

			const aiLabel = options.ai === 'codex' ? '`codex exec`' : '`claude -p`';
			console.log(
				`🤖 Consolidating test instructions via ${ aiLabel } for Jetpack ${ releaseVersion }...`
			);
			testInstructions = await generateAIConsolidatedInstructions(
				entries,
				prDetails,
				releaseVersion,
				options.ai
			);
		}

		// Step 5: Write to file
		fs.writeFileSync( options.output, testInstructions );
	} catch ( error ) {
		console.error( `\n❌ Error: ${ error.message }` );
		process.exit( 1 );
	}
}

// Run the main function
main();
