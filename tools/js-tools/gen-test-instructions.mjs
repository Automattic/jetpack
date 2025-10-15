#!/usr/bin/env node

/**
 * Generate Test Instructions Tool
 *
 * This tool automates the generation of test instructions for Jetpack releases by:
 * 1. Parsing the CHANGELOG.md to extract entries since a specified version
 * 2. Fetching PR details from GitHub using the gh CLI
 * 3. Extracting testing instructions from PR descriptions
 * 4. Optionally consolidating instructions using Claude AI
 * 5. Generating a markdown document with all PR numbers as clickable links
 *
 * Usage node gen-test-instructions.mjs --changelog <path> --output <file> [options]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const GITHUB_REPO = 'Automattic/jetpack';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

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
		version: null,
		sinceDate: null,
		apiKey: process.env.ANTHROPIC_API_KEY || null,
		skipAi: false,
	};

	for ( let i = 0; i < args.length; i++ ) {
		switch ( args[ i ] ) {
			case '--changelog':
				options.changelog = args[ ++i ];
				break;
			case '--output':
				options.output = args[ ++i ];
				break;
			case '--version':
				options.version = args[ ++i ];
				break;
			case '--since-date':
				options.sinceDate = args[ ++i ];
				break;
			case '--api-key':
				options.apiKey = args[ ++i ];
				break;
			case '--skip-ai':
				options.skipAi = true;
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

	return options;
}

// ============================================================================
// CHANGELOG PARSING
// ============================================================================

/**
 * Parse the changelog file and extract entries since a specific version or date.
 *
 * The changelog is organized in reverse chronological order (newest first).
 * This function collects all entries from the top until it reaches the cutoff version.
 *
 * @param {string} changelogPath - Absolute path to CHANGELOG.md
 * @param {string} sinceVersion  - Start from entries after this version (optional)
 * @param {string} sinceDate     - Start from entries after this date (optional)
 * @return {object} Object with entries, startVersion, and versions array
 */
function parseChangelog( changelogPath, sinceVersion, sinceDate ) {
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
	const entryRegex = /^- (.+?) \[#(\d+)\]/;

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

	// Second pass: collect entries (changelog is reverse chronological)
	for ( const line of lines ) {
		const versionMatch = line.match( versionRegex );
		if ( versionMatch ) {
			currentVersion = versionMatch[ 1 ];
			currentDate = versionMatch[ 2 ];

			// Stop when we reach the cutoff version
			if ( startVersion && currentVersion === startVersion ) {
				break;
			} else if ( sinceDate && currentDate < sinceDate ) {
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
				entries.push( {
					text: entryMatch[ 1 ],
					prNumber: entryMatch[ 2 ],
					section: currentSection,
					version: currentVersion,
					date: currentDate,
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
					const linkedInstructions = convertPRNumbersToLinks( pr.testingInstructions );
					output += `${ linkedInstructions }\n\n`;
				} else {
					output += '_No specific testing instructions provided._\n\n';
					if ( pr.body ) {
						const linkedBody = convertPRNumbersToLinks( pr.body.substring( 0, 300 ) + '...' );
						output += `**PR Description:**\n${ linkedBody }\n\n`;
					} else {
						output += '**PR Description:** N/A\n\n';
					}
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
 * Generate AI-consolidated test instructions using Claude API.
 *
 * @param {Array}  entries   - Changelog entries
 * @param {Array}  prDetails - PR details with testing instructions
 * @param {string} apiKey    - Anthropic API key
 * @param {string} version   - Version being tested
 * @return {Promise<string>} Markdown formatted consolidated test instructions
 */
async function generateAIConsolidatedInstructions( entries, prDetails, apiKey, version ) {
	// Prepare data for AI processing
	const prMap = new Map( prDetails.map( pr => [ pr.number.toString(), pr ] ) );
	const prsBySection = {};

	entries.forEach( entry => {
		const section = entry.section || 'Other';
		if ( ! prsBySection[ section ] ) {
			prsBySection[ section ] = [];
		}

		const pr = prMap.get( entry.prNumber );
		if ( pr && ! prsBySection[ section ].some( p => p.number.toString() === entry.prNumber ) ) {
			prsBySection[ section ].push( {
				number: pr.number,
				title: pr.title,
				changelogText: entry.text,
				testingInstructions: pr.testingInstructions || 'No testing instructions provided.',
			} );
		}
	} );

	// Construct the AI prompt
	const prompt = `You are helping to create a consolidated testing guide for Jetpack plugin version ${
		version || 'upcoming release'
	}.

I have changelog entries grouped by feature area/section. Each entry includes:
- The PR number and title
- The changelog entry text
- Testing instructions from the PR (if available)

Your task is to:
1. Analyze the testing instructions for each section
2. Consolidate similar or overlapping test steps
3. Remove redundant instructions
4. Organize tests in a logical order within each section
5. Provide clear, actionable testing steps
6. Note which features/areas need the most attention
7. Identify any changes without test instructions that might need manual testing

IMPORTANT REQUIREMENTS FOR PR REFERENCES:
- ALWAYS reference PR numbers when discussing changes
- Format PR numbers as markdown links: [#12345](https://github.com/${ GITHUB_REPO }/pull/12345)
- List all related PR numbers at the beginning of each section
- Do NOT omit or skip PR numbers - they are critical for tracking
- When combining multiple PRs into one testing section, list ALL PR numbers involved as links

Output format should be a well-structured markdown document with:
- A summary section highlighting key areas to test
- Each feature area as a heading with PR numbers listed as clickable links
- Consolidated test steps (not just copying individual PR instructions)
- All PR number references formatted as: [#12345](https://github.com/${ GITHUB_REPO }/pull/12345)
- A section for changes without specific test instructions (with PR links)

Here is the data:

${ JSON.stringify( prsBySection, null, 2 ) }

Generate the consolidated test guide now. Remember to format ALL PR numbers as markdown links!`;

	try {
		// Call Claude API
		const response = await fetch( CLAUDE_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify( {
				model: CLAUDE_MODEL,
				max_tokens: 4096,
				messages: [ { role: 'user', content: prompt } ],
			} ),
		} );

		if ( ! response.ok ) {
			throw new Error( `API request failed: ${ response.status } ${ response.statusText }` );
		}

		const data = await response.json();
		const consolidatedGuide = data.content[ 0 ].text;

		// Add metadata header
		let output = `# Test Instructions for Jetpack ${ version || 'Release' }\n\n`;
		output += `Generated on: ${ new Date().toISOString().split( 'T' )[ 0 ] }\n`;
		output += `Total PRs: ${ prDetails.length }\n\n`;
		output += '---\n\n';
		output += consolidatedGuide;

		return output;
	} catch ( error ) {
		console.warn(
			`\n⚠️  AI consolidation failed: ${ error.message }. Falling back to raw output.\n`
		);
		return generateRawTestInstructions( entries, prDetails );
	}
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

		// Step 1: Parse changelog
		const relativeChangelogPath = path.relative( process.cwd(), options.changelog );
		console.log( `\n📖 Reading changelog from: ${ relativeChangelogPath }` );

		const parseResult = parseChangelog( options.changelog, options.version, options.sinceDate );
		const entries = parseResult.entries;

		if ( entries.length === 0 ) {
			throw new Error( 'No changelog entries found for the specified criteria.' );
		}

		console.log(
			`✓ Found ${ entries.length } changelog entries since version ${ parseResult.startVersion }\n`
		);

		// Step 2: Extract PR numbers
		const prNumbers = extractPRNumbers( entries );
		console.log( `🔍 Identified ${ prNumbers.length } unique PRs\n` );

		// Step 3: Fetch PR details from GitHub
		console.log( '📥 Fetching PR details from GitHub...' );
		const prDetails = await fetchPRDetails( prNumbers );
		console.log( `✓ Fetched details for ${ prDetails.length } PRs\n` );

		// Step 4: Generate test instructions
		let testInstructions;

		if ( options.skipAi || ! options.apiKey ) {
			if ( ! options.skipAi ) {
				console.log( '⚠️  No API key provided. Using raw output mode.\n' );
			}
			testInstructions = generateRawTestInstructions( entries, prDetails );
		} else {
			console.log( '🤖 Using AI to consolidate test instructions...' );
			testInstructions = await generateAIConsolidatedInstructions(
				entries,
				prDetails,
				options.apiKey,
				options.version || parseResult.startVersion
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
