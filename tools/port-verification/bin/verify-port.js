#!/usr/bin/env node
/**
 * CLI for JETPACK-2685: steps 2 (geometry) and 3 (network) of the wp-build port
 * verification check, run against a live site with the port flag off and on.
 *
 * Usage: see README.md, or `node bin/verify-port.js --help`.
 */

import fs from 'fs';
import readline from 'readline/promises';
import { diffSnapshots } from '../src/diff.js';
import { parseOptions } from '../src/options.js';
import { formatReport } from '../src/report.js';
import { DEFAULT_IGNORED_HOSTS, DEFAULT_IGNORED_QUERY_PARAMS } from '../src/selectors.js';

// Loaded lazily (only by `capture` and `run`) so `--help` and `diff` -- which need no
// browser -- still work without Playwright installed.
async function loadCapturePage() {
	return ( await import( '../src/capture.js' ) ).capturePage;
}

const USAGE = `Usage:
  verify-port run    --url <url> [--flag <name>] [--user <user> --pass <pass>]
                      [--control-selector <css>] [--wait-selector <css>]
                      [--load-state <state>] [--tolerance <px>] [--out <report.md>]

  verify-port capture --url <url> [--user <user> --pass <pass>]
                      [--autologin-url <url>] [--control-selector <css>]
                      [--wait-selector <css>] [--load-state <state>]
                      --out <snapshot.json>

  verify-port diff   --before <before.json> --after <after.json>
                      [--tolerance <px>] [--out <report.md>]

Credentials also read from WP_ADMIN_USER / WP_ADMIN_PASS.
--ignore-query-param <name> (repeatable) adds to the default ignored list
(${ DEFAULT_IGNORED_QUERY_PARAMS.join( ', ' ) }) for step 3's request matching and display.
--ignore-host <host> (repeatable) adds to the ignored hosts (${ DEFAULT_IGNORED_HOSTS.join( ', ' ) }).
The report goes to stdout; progress and prompts go to stderr, so '> report.md' is safe.
See README.md for the full walkthrough, including how to flip the flag between captures.`;

/**
 * @param {string} path
 * @param {object} data
 * @return {void}
 */
function writeJson( path, data ) {
	fs.writeFileSync( path, JSON.stringify( data, null, 2 ) + '\n' );
}

/**
 * @param {object} options - From `parseOptions()`.
 * @return {Promise<void>}
 */
async function runCapture( options ) {
	if ( ! options.url || ! options.out ) {
		throw new Error( '--url and --out are required for `capture`.' );
	}
	const capturePage = await loadCapturePage();
	const snapshot = await capturePage( options );
	writeJson( options.out, snapshot );
	console.error( `Captured ${ options.url } -> ${ options.out }` );
}

/**
 * @param {object} options - From `parseOptions()`.
 * @return {void}
 */
function runDiff( options ) {
	if ( ! options.before || ! options.after ) {
		throw new Error( '--before and --after are required for `diff`.' );
	}
	const before = JSON.parse( fs.readFileSync( options.before, 'utf8' ) );
	const after = JSON.parse( fs.readFileSync( options.after, 'utf8' ) );
	printReport( before, after, options );
}

/**
 * @param {object} before  - Flag-off snapshot.
 * @param {object} after   - Flag-on snapshot.
 * @param {object} options - From `parseOptions()`.
 * @return {void}
 */
function printReport( before, after, options ) {
	const diffResult = diffSnapshots( before, after, options );
	// The captures know which selectors they were actually given; the defaults call every
	// control optional, which would let a control that vanished pass as "not present".
	const targets = after.meta?.targets ?? before.meta?.targets ?? undefined;
	const report = formatReport(
		diffResult,
		{
			url: after.meta?.url ?? before.meta?.url ?? options.url,
			beforeUrl: before.meta?.url,
			afterUrl: after.meta?.url,
			flag: options.flag,
			beforeCapturedAt: before.meta?.capturedAt,
			afterCapturedAt: after.meta?.capturedAt,
		},
		targets,
		options
	);
	if ( options.out ) {
		fs.writeFileSync( options.out, report + '\n' );
		console.error( `Report written to ${ options.out }` );
	}
	console.log( report );
}

/**
 * Capture flag-off, pause for the reviewer to flip the flag on the site, capture
 * flag-on, then diff and print. The one command JETPACK-2685 asks for.
 *
 * @param {object} options - From `parseOptions()`.
 * @return {Promise<void>}
 */
async function runFull( options ) {
	if ( ! options.url ) {
		throw new Error( '--url is required for `run`.' );
	}
	if ( ! process.stdin.isTTY ) {
		throw new Error(
			'`run` needs an interactive terminal for the flag prompt. Use `capture` twice and `diff`.'
		);
	}
	const capturePage = await loadCapturePage();

	// A --wait-selector names boot's mount, which exists only with the flag on. Requiring it
	// flag-off would time out the first capture; requiring its absence proves the flip landed.
	console.error( `Capturing with the flag OFF: ${ options.url }` );
	const before = await capturePage( {
		...options,
		waitForSelector: undefined,
		absentSelector: options.waitForSelector,
	} );

	await confirmFlagFlipped( options.flag );

	console.error( `Capturing with the flag ON: ${ options.url }` );
	const after = await capturePage( { ...options, absentSelector: undefined } );

	printReport( before, after, options );
}

/**
 * Ask for a word rather than a bare Enter, so a stray keypress buffered during the first
 * capture cannot answer the prompt and leave both captures on the same side of the flag.
 *
 * @param {string} [flag] - Flag name, which doubles as the confirmation word.
 * @return {Promise<void>}
 */
async function confirmFlagFlipped( flag ) {
	const token = ( flag ?? 'on' ).toLowerCase();
	const rl = readline.createInterface( { input: process.stdin, output: process.stderr } );
	try {
		const closedEarly = new Promise( ( _, reject ) => {
			rl.once( 'close', () =>
				reject( new Error( 'Input closed before the flag was confirmed.' ) )
			);
		} );
		const answer = await Promise.race( [
			rl.question(
				`\nFlip ${ flag ?? 'the port flag' } ON now, then type "${ token }" and press Enter: `
			),
			closedEarly,
		] );
		if ( answer.trim().toLowerCase() !== token ) {
			throw new Error(
				`Expected "${ token }", got "${ answer.trim() }" -- stopping rather than capturing the same state twice.`
			);
		}
	} finally {
		rl.close();
	}
}

async function main() {
	const argv = process.argv.slice( 2 );
	// A leading option (e.g. bare `--help`) has no subcommand; anything else does.
	const hasCommand = argv.length > 0 && ! argv[ 0 ].startsWith( '-' );
	const command = hasCommand ? argv[ 0 ] : undefined;
	const options = parseOptions( hasCommand ? argv.slice( 1 ) : argv );

	if ( options.help || ! command ) {
		( options.help ? console.log : console.error )( USAGE );
		process.exit( options.help ? 0 : 1 );
	}

	if ( command === 'capture' ) {
		await runCapture( options );
	} else if ( command === 'diff' ) {
		runDiff( options );
	} else if ( command === 'run' ) {
		await runFull( options );
	} else {
		console.error( `Unknown command: ${ command }\n` );
		console.error( USAGE );
		process.exit( 1 );
	}
}

main().catch( err => {
	console.error( process.env.DEBUG ? ( err.stack ?? err.message ) : err.message );
	process.exit( 1 );
} );
