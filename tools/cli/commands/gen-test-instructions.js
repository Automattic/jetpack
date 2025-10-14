import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import enquirer from 'enquirer';
import { chalkJetpackGreen } from '../helpers/styling.js';

/**
 * Command definition for the gen-test-instructions subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the gen-test-instructions commands defined.
 */
export function genTestInstructionsDefine( yargs ) {
	yargs.command(
		'gen-test-instructions [version]',
		'Generates consolidated test instructions from changelog entries',
		yarg => {
			yarg
				.positional( 'version', {
					describe: 'Start after this version (e.g., 15.1). Defaults to last stable release.',
					type: 'string',
				} )
				.option( 'changelog', {
					alias: 'c',
					describe: 'Path to CHANGELOG.md file',
					type: 'string',
					default: 'projects/plugins/jetpack/CHANGELOG.md',
				} )
				.option( 'output', {
					alias: 'o',
					describe: 'Output file path for test instructions',
					type: 'string',
				} )
				.option( 'since-date', {
					describe: 'Include changelog entries since this date (YYYY-MM-DD)',
					type: 'string',
				} )
				.option( 'api-key', {
					describe: 'Anthropic API key for AI consolidation (or set ANTHROPIC_API_KEY env var)',
					type: 'string',
				} )
				.option( 'skip-ai', {
					describe: 'Skip AI consolidation and just output raw test instructions',
					type: 'boolean',
					default: false,
				} );
		},
		async argv => {
			await genTestInstructionsCli( argv );
		}
	);

	return yargs;
}

/**
 * Main CLI handler for gen-test-instructions command.
 *
 * @param {object} argv - Command line arguments.
 */
async function genTestInstructionsCli( argv ) {
	try {
		console.log( chalkJetpackGreen( '🧪 Generating Test Instructions...\n' ) );

		// Validate changelog file exists
		const changelogPath = path.resolve( argv.changelog );
		if ( ! fs.existsSync( changelogPath ) ) {
			throw new Error( `Changelog file not found at: ${ changelogPath }` );
		}

		// Parse changelog to extract entries
		const relativeChangelogPath = path.relative( process.cwd(), changelogPath );
		console.log( chalk.blue( `📖 Reading changelog from: ${ relativeChangelogPath }` ) );
		const parseResult = parseChangelog( changelogPath, argv.version, argv.sinceDate );
		const entries = parseResult.entries;

		if ( entries.length === 0 ) {
			throw new Error( 'No changelog entries found for the specified criteria.' );
		}

		console.log(
			chalk.green(
				`✓ Found ${ entries.length } changelog entries since version ${ parseResult.startVersion }\n`
			)
		);

		// Extract PR numbers
		const prNumbers = extractPRNumbers( entries );
		console.log( chalk.blue( `🔍 Identified ${ prNumbers.length } unique PRs\n` ) );

		// Fetch PR details from GitHub
		console.log( chalk.blue( '📥 Fetching PR details from GitHub...' ) );
		const prDetails = await fetchPRDetails( prNumbers );
		console.log( chalk.green( `✓ Fetched details for ${ prDetails.length } PRs\n` ) );

		// Generate test instructions
		let testInstructions;
		if ( argv.skipAi ) {
			testInstructions = generateRawTestInstructions( entries, prDetails );
		} else {
			const apiKey = argv.apiKey || process.env.ANTHROPIC_API_KEY;
			if ( ! apiKey ) {
				console.log(
					chalk.yellow(
						'⚠️  No API key provided. Using raw output mode. Pass --api-key or set ANTHROPIC_API_KEY env var for AI consolidation.\n'
					)
				);
				testInstructions = generateRawTestInstructions( entries, prDetails );
			} else {
				console.log( chalk.blue( '🤖 Using AI to consolidate test instructions...' ) );
				testInstructions = await generateAIConsolidatedInstructions(
					entries,
					prDetails,
					apiKey,
					argv.version
				);
			}
		}

		// Determine output path
		const outputPath = argv.output || ( await promptForOutputPath( argv.version ) );

		// Write to file
		fs.writeFileSync( outputPath, testInstructions );
		console.log( chalkJetpackGreen( `\n✅ Test guide generated successfully!\n` ) );
		console.log( chalk.cyan( `📄 Output file: ${ outputPath }` ) );
		console.log(
			chalk.dim( `\nYou can now review and edit the test instructions before sharing.\n` )
		);
	} catch ( error ) {
		console.error( chalk.red( `\n❌ Error: ${ error.message }` ) );
		if ( argv.v ) {
			console.error( error );
		}
		process.exit( 1 );
	}
}

/**
 * Parse changelog file and extract entries since a specific version or date.
 *
 * @param {string} changelogPath - Path to CHANGELOG.md file.
 * @param {string} sinceVersion  - Start from entries after this version (optional).
 * @param {string} sinceDate     - Date to filter from (optional).
 * @return {object} Object with entries array and metadata.
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

			// A stable version doesn't have -a., -b., -rc. suffixes (alpha, beta, rc)
			// Examples: 15.1 and 15.1.1 are stable, but 15.2-a.1 is not
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
			`Version "${ sinceVersion }" not found in changelog. Available versions: ${ versions
				.slice( 0, 10 )
				.map( v => v.version )
				.join( ', ' ) }...`
		);
	}

	// Second pass: collect entries after the start version
	// Note: Changelog is in reverse chronological order (newest first)
	// So we collect entries BEFORE we find the start version
	for ( const line of lines ) {
		const versionMatch = line.match( versionRegex );
		if ( versionMatch ) {
			currentVersion = versionMatch[ 1 ];
			currentDate = versionMatch[ 2 ];

			// If we find the start version, STOP collecting (we've reached the cutoff)
			if ( startVersion && currentVersion === startVersion ) {
				collectingEntries = false;
				break; // Stop processing, we've reached our cutoff
			} else if ( sinceDate && currentDate < sinceDate ) {
				// If using date filter and current date is before sinceDate, stop
				collectingEntries = false;
				break;
			} else {
				// Haven't reached the cutoff yet, so collect entries
				collectingEntries = true;
			}

			currentSection = null;
			continue;
		}

		// Check for section header
		const sectionMatch = line.match( sectionRegex );
		if ( sectionMatch ) {
			currentSection = sectionMatch[ 1 ];
			continue;
		}

		// Check for changelog entry with PR number
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
		versions: versions.slice( 0, Math.min( versions.length, 20 ) ), // Return first 20 versions for reference
	};
}

/**
 * Extract unique PR numbers from changelog entries.
 *
 * @param {Array} entries - Changelog entries.
 * @return {Array} Array of unique PR numbers.
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

/**
 * Fetch PR details from GitHub using gh CLI.
 *
 * @param {Array} prNumbers - Array of PR numbers to fetch.
 * @return {Promise<Array>} Array of PR details objects.
 */
async function fetchPRDetails( prNumbers ) {
	const prDetails = [];

	for ( const prNumber of prNumbers ) {
		try {
			// Fetch PR details using gh CLI
			const prData = execSync(
				`gh pr view ${ prNumber } --json number,title,body,labels,author --repo Automattic/jetpack`,
				{ encoding: 'utf-8' }
			);

			const pr = JSON.parse( prData );

			// Extract testing instructions from PR body
			const testingInstructions = extractTestingInstructions( pr.body );

			prDetails.push( {
				number: pr.number,
				title: pr.title,
				body: pr.body,
				testingInstructions,
				labels: pr.labels.map( l => l.name ),
				author: pr.author.login,
			} );

			// Add a small delay to avoid rate limiting
			await sleep( 100 );
		} catch ( error ) {
			console.warn( chalk.yellow( `⚠️  Could not fetch PR #${ prNumber }: ${ error.message }` ) );
		}
	}

	return prDetails;
}

/**
 * Extract testing instructions from PR body.
 *
 * @param {string} prBody - PR description body.
 * @return {string|null} Extracted testing instructions or null.
 */
function extractTestingInstructions( prBody ) {
	if ( ! prBody ) {
		return null;
	}

	// Common patterns for testing instructions sections
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

/**
 * Generate raw (non-AI) test instructions output.
 *
 * @param {Array} entries   - Changelog entries.
 * @param {Array} prDetails - PR details with testing instructions.
 * @return {string} Markdown formatted test instructions.
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
				// Make the PR title itself a hyperlink
				output += `### [${ pr.title }](https://github.com/Automattic/jetpack/pull/${ pr.number }) (#${ pr.number })\n\n`;

				if ( pr.testingInstructions ) {
					// Convert any PR numbers in the testing instructions to links
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

/**
 * Convert PR number references to clickable GitHub links.
 *
 * @param {string} text - Text containing PR references.
 * @return {string} Text with PR numbers converted to links.
 */
function convertPRNumbersToLinks( text ) {
	// Pattern 1: [#12345] (not already a link) -> [#12345](https://github.com/Automattic/jetpack/pull/12345)
	text = text.replace( /\[#(\d+)\](?!\()/g, ( _match, prNum ) => {
		return `[#${ prNum }](https://github.com/Automattic/jetpack/pull/${ prNum })`;
	} );

	// Pattern 2: PR #12345 at word boundaries -> PR [#12345](https://github.com/Automattic/jetpack/pull/12345)
	// Only match if not already inside a markdown link
	text = text.replace( /(?<!\[)(?<!\()PR #(\d+)\b/g, ( _match, prNum ) => {
		return `PR [#${ prNum }](https://github.com/Automattic/jetpack/pull/${ prNum })`;
	} );

	// Pattern 3: Standalone #12345 at word boundaries -> [#12345](https://github.com/Automattic/jetpack/pull/12345)
	// Avoid markdown headings (###), already linked numbers, and matches inside brackets
	text = text.replace( /(?<!\[)(?<!#)(?<!\()(?<!\/)#(\d{4,})\b/g, ( _match, prNum ) => {
		return `[#${ prNum }](https://github.com/Automattic/jetpack/pull/${ prNum })`;
	} );

	return text;
}

/**
 * Generate AI-consolidated test instructions using Claude API.
 *
 * @param {Array}  entries   - Changelog entries.
 * @param {Array}  prDetails - PR details with testing instructions.
 * @param {string} apiKey    - Anthropic API key.
 * @param {string} version   - Version being tested.
 * @return {Promise<string>} Markdown formatted consolidated test instructions.
 */
async function generateAIConsolidatedInstructions( entries, prDetails, apiKey, version ) {
	// Prepare the data for AI processing
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
- Format PR numbers as markdown links: [#12345](https://github.com/Automattic/jetpack/pull/12345)
- List all related PR numbers at the beginning of each section
- Do NOT omit or skip PR numbers - they are critical for tracking
- When combining multiple PRs into one testing section, list ALL PR numbers involved as links

Output format should be a well-structured markdown document with:
- A summary section highlighting key areas to test
- Each feature area as a heading with PR numbers listed as clickable links
- Consolidated test steps (not just copying individual PR instructions)
- All PR number references formatted as: [#12345](https://github.com/Automattic/jetpack/pull/12345)
- A section for changes without specific test instructions (with PR links)

Here is the data:

${ JSON.stringify( prsBySection, null, 2 ) }

Generate the consolidated test guide now. Remember to format ALL PR numbers as markdown links!`;

	try {
		// Call Claude API
		const response = await fetch( 'https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify( {
				model: 'claude-3-5-sonnet-20241022',
				max_tokens: 4096,
				messages: [
					{
						role: 'user',
						content: prompt,
					},
				],
			} ),
		} );

		if ( ! response.ok ) {
			throw new Error( `API request failed: ${ response.status } ${ response.statusText }` );
		}

		const data = await response.json();
		const consolidatedGuide = data.content[ 0 ].text;

		// Note: PR numbers should already be formatted as links by the AI
		// but we could add a fallback conversion here if needed

		// Add metadata header
		let output = `# Test Instructions for Jetpack ${ version || 'Release' }\n\n`;
		output += `Generated on: ${ new Date().toISOString().split( 'T' )[ 0 ] }\n`;
		output += `Total PRs: ${ prDetails.length }\n\n`;
		output += '---\n\n';
		output += consolidatedGuide;

		return output;
	} catch ( error ) {
		console.warn(
			chalk.yellow(
				`\n⚠️  AI consolidation failed: ${ error.message }. Falling back to raw output.\n`
			)
		);
		return generateRawTestInstructions( entries, prDetails );
	}
}

/**
 * Prompt user for output file path.
 *
 * @param {string} version - Version string.
 * @return {Promise<string>} Output file path.
 */
async function promptForOutputPath( version ) {
	const defaultName = `test-instructions-${ version || 'latest' }.md`;
	const response = await enquirer.prompt( {
		type: 'input',
		name: 'outputPath',
		message: 'Where should the test guide be saved?',
		initial: defaultName,
	} );

	return response.outputPath;
}

/**
 * Simple sleep utility.
 *
 * @param {number} ms - Milliseconds to sleep.
 * @return {Promise} Promise that resolves after ms milliseconds.
 */
function sleep( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}
