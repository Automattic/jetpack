#!/usr/bin/env node

/**
 * ESLint wrapper that auto-applies the bulk suppressions file, detects stale
 * suppressions, and optionally formats the suppressions file after pruning.
 *
 * Adapted from WordPress/gutenberg – tools/eslint/lint-js.cjs
 */

const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const STALE_SUPPRESSIONS_TOKEN = '--prune-suppressions';

const PRUNE_HELP_MESSAGE =
	'👉 Run `pnpm run lint:js:prune-suppressions` and commit the updated `tools/eslint/suppressions.json`.';

const SUPPRESSIONS_FILE = path.join( __dirname, 'suppressions.json' );

// Resolve ESLint and Prettier via the js-tools workspace (which declares them as deps).
const jstoolsDir = path.join( __dirname, '..', 'js-tools' );
const eslintPkgPath = require.resolve( 'eslint/package.json', { paths: [ jstoolsDir ] } );
const eslintBin = path.join( path.dirname( eslintPkgPath ), require( eslintPkgPath ).bin.eslint );
const prettierPkgPath = require.resolve( 'prettier/package.json', { paths: [ jstoolsDir ] } );
const prettierPkgData = require( prettierPkgPath );
const prettierBinRelative =
	typeof prettierPkgData.bin === 'string' ? prettierPkgData.bin : prettierPkgData.bin.prettier;
const prettierBin = path.join( path.dirname( prettierPkgPath ), prettierBinRelative );

const userArgs = process.argv.slice( 2 );
const args = userArgs.some( arg => arg.startsWith( '--suppressions-location' ) )
	? userArgs
	: [ '--suppressions-location', SUPPRESSIONS_FILE, ...userArgs ];

const eslintFlags = [ '--flag', 'v10_config_lookup_from_file' ];

// Re-enable color when the parent has a TTY (child pipes disable it by default).
const childEnv = { ...process.env };
if ( childEnv.FORCE_COLOR === undefined && ( process.stdout.isTTY || process.stderr.isTTY ) ) {
	childEnv.FORCE_COLOR = '1';
}

// A small sliding tail buffer so we can scan for the stale-suppressions token
// without buffering all output.
const tailLength = STALE_SUPPRESSIONS_TOKEN.length - 1;
let outputTail = '';
let staleSuppressionsDetected = false;

const child = spawn( process.execPath, [ eslintBin, ...eslintFlags, ...args ], {
	stdio: [ 'inherit', 'pipe', 'pipe' ],
	env: childEnv,
} );

child.stdout.on( 'data', handleChunk( process.stdout ) );
child.stderr.on( 'data', handleChunk( process.stderr ) );

child.on( 'error', error => {
	throw error;
} );

child.on( 'close', ( code, signal ) => {
	if ( shouldShowPruneHint() ) {
		process.stderr.write( `\n${ PRUNE_HELP_MESSAGE }\n` );
	}

	if ( signal ) {
		process.kill( process.pid, signal );
		return;
	}

	// After --prune-suppressions, format the file through Prettier so the diff
	// stays clean and consistent with the repo's formatting settings.
	if ( args.includes( STALE_SUPPRESSIONS_TOKEN ) && fs.existsSync( SUPPRESSIONS_FILE ) ) {
		formatSuppressionsFile( code );
		return;
	}

	process.exitCode = code ?? 1;
} );

/**
 * Creates a data handler that forwards chunks to a stream and scans for stale-suppression tokens.
 *
 * @param {NodeJS.WritableStream} destination - Stream to forward chunks to.
 * @return {(chunk: import('node:buffer').Buffer) => void} Data event handler.
 */
function handleChunk( destination ) {
	return chunk => {
		destination.write( chunk );
		scanForStaleSuppressions( chunk );
	};
}

/**
 * Scans a chunk of child output for the stale-suppressions token.
 *
 * @param {import('node:buffer').Buffer} chunk - Chunk of child output.
 */
function scanForStaleSuppressions( chunk ) {
	if ( staleSuppressionsDetected ) {
		return;
	}

	const window = outputTail + chunk.toString( 'utf8' );

	if ( window.includes( STALE_SUPPRESSIONS_TOKEN ) ) {
		staleSuppressionsDetected = true;
		outputTail = '';
		return;
	}

	outputTail = window.slice( -tailLength );
}

/**
 * Returns whether the stale-suppressions prune hint should be printed to stderr.
 *
 * @return {boolean} Whether to print the repo-specific prune hint.
 */
function shouldShowPruneHint() {
	return (
		staleSuppressionsDetected &&
		! args.includes( '--pass-on-unpruned-suppressions' ) &&
		! args.includes( STALE_SUPPRESSIONS_TOKEN )
	);
}

/**
 * Formats the suppressions file through Prettier after a prune run.
 *
 * @param {number|null} lintExitCode - Exit code from the lint child process.
 */
function formatSuppressionsFile( lintExitCode ) {
	const formatChild = spawn( process.execPath, [ prettierBin, '--write', SUPPRESSIONS_FILE ], {
		stdio: 'inherit',
		env: childEnv,
	} );

	formatChild.on( 'error', error => {
		throw error;
	} );

	formatChild.on( 'close', ( formatCode, formatSignal ) => {
		if ( formatSignal ) {
			process.kill( process.pid, formatSignal );
			return;
		}

		process.exitCode = resolveExitCode( lintExitCode, formatCode );
	} );
}

/**
 * Resolves the final exit code from the lint and format sub-processes.
 *
 * @param {number|null} lintExitCode   - Exit code from the lint child process.
 * @param {number|null} formatExitCode - Exit code from the format child process.
 * @return {number} Exit code to use for the wrapper process.
 */
function resolveExitCode( lintExitCode, formatExitCode ) {
	if ( lintExitCode !== null && lintExitCode !== 0 ) {
		return lintExitCode;
	}

	return formatExitCode ?? lintExitCode ?? 1;
}
