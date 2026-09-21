#!/usr/bin/env node
/**
 * CLI for JETPACK-2685: steps 2 (geometry) and 3 (network) of the wp-build port
 * verification check, run against a live site with the port flag off and on.
 *
 * Usage: see README.md, or `node bin/verify-port.js --help`.
 */

import fs from 'fs';
import readline from 'readline/promises';
import { parseArgs } from 'util';
import { diffSnapshots } from '../src/diff.js';
import { formatReport } from '../src/report.js';
import { DEFAULT_IGNORED_QUERY_PARAMS, DEFAULT_TOLERANCE_PX } from '../src/selectors.js';

// Loaded lazily (only by `capture` and `run`) so `--help` and `diff` -- which need no
// browser -- still work without Playwright installed.
async function loadCapturePage() {
	return ( await import( '../src/capture.js' ) ).capturePage;
}

const USAGE = `Usage:
  verify-port run    --url <url> [--flag <name>] [--user <user> --pass <pass>]
                      [--control-selector <css>] [--wait-selector <css>]
                      [--tolerance <px>] [--out <report.md>]

  verify-port capture --url <url> [--user <user> --pass <pass>]
                      [--control-selector <css>] [--wait-selector <css>]
                      --out <snapshot.json>

  verify-port diff   --before <before.json> --after <after.json>
                      [--tolerance <px>] [--out <report.md>]

Credentials also read from WP_ADMIN_USER / WP_ADMIN_PASS.
--ignore-query-param <name> (repeatable) adds to the default ignored list
(${ DEFAULT_IGNORED_QUERY_PARAMS.join( ', ' ) }) for step 3's request matching and display.
See README.md for the full walkthrough, including how to flip the flag between captures.`;

const OPTION_SPEC = {
	url: { type: 'string' },
	flag: { type: 'string' },
	user: { type: 'string' },
	pass: { type: 'string' },
	'control-selector': { type: 'string' },
	'wait-selector': { type: 'string' },
	tolerance: { type: 'string' },
	'ignore-query-param': { type: 'string', multiple: true, default: [] },
	out: { type: 'string' },
	before: { type: 'string' },
	after: { type: 'string' },
	headed: { type: 'boolean', default: false },
	help: { type: 'boolean', default: false },
};

/**
 * @param {string[]} argv - Everything after the subcommand.
 * @return {object} Parsed options, camel-cased from `OPTION_SPEC`'s kebab-case keys.
 */
function parseOptions( argv ) {
	const { values } = parseArgs( { args: argv, options: OPTION_SPEC, allowPositionals: false } );
	const extraIgnoreParams = values[ 'ignore-query-param' ];
	return {
		url: values.url,
		flag: values.flag,
		username: values.user ?? process.env.WP_ADMIN_USER,
		password: values.pass ?? process.env.WP_ADMIN_PASS,
		controlSelector: values[ 'control-selector' ],
		waitForSelector: values[ 'wait-selector' ],
		tolerancePx: values.tolerance ? Number( values.tolerance ) : DEFAULT_TOLERANCE_PX,
		ignoreQueryParams: extraIgnoreParams.length
			? [ ...DEFAULT_IGNORED_QUERY_PARAMS, ...extraIgnoreParams ]
			: undefined,
		out: values.out,
		before: values.before,
		after: values.after,
		headless: ! values.headed,
		help: values.help,
	};
}

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
	console.log( `Captured ${ options.url } -> ${ options.out }` );
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
	const report = formatReport(
		diffResult,
		{
			url: after.meta?.url ?? before.meta?.url ?? options.url,
			flag: options.flag,
			beforeCapturedAt: before.meta?.capturedAt,
			afterCapturedAt: after.meta?.capturedAt,
		},
		undefined,
		options
	);
	if ( options.out ) {
		fs.writeFileSync( options.out, report + '\n' );
		console.log( `Report written to ${ options.out }` );
	}
	console.log( '' );
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
	const capturePage = await loadCapturePage();

	console.log( `Capturing with the flag OFF: ${ options.url }` );
	const before = await capturePage( options );

	const rl = readline.createInterface( { input: process.stdin, output: process.stdout } );
	await rl.question(
		`\nFlip ${ options.flag ?? 'the port flag' } ON on the site now, then press Enter to continue... `
	);
	rl.close();

	console.log( `Capturing with the flag ON: ${ options.url }` );
	const after = await capturePage( options );

	printReport( before, after, options );
}

async function main() {
	const argv = process.argv.slice( 2 );
	// A leading option (e.g. bare `--help`) has no subcommand; anything else does.
	const hasCommand = argv.length > 0 && ! argv[ 0 ].startsWith( '-' );
	const command = hasCommand ? argv[ 0 ] : undefined;
	const options = parseOptions( hasCommand ? argv.slice( 1 ) : argv );

	if ( options.help || ! command ) {
		console.log( USAGE );
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
		console.log( USAGE );
		process.exit( 1 );
	}
}

main().catch( err => {
	console.error( err.stack ?? err.message );
	process.exit( 1 );
} );
