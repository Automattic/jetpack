/**
 * Unit and integration tests for the CodeVitals posting tool.
 *
 * CodeVitals is append-only with no rollback, so these tests pin the contract
 * that keeps bad data out: checkSanityRange must fail closed on anything it
 * cannot positively confirm is in range, postToCodeVitals must not let a
 * rejected value into the payload, and the CLI must actually run when invoked
 * directly (even from a path with a space). Run with `pnpm test:unit`
 * (node's built-in runner — no Docker, no token, no network).
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import {
	checkSanityRange,
	extractScenarioMetrics,
	isDirectInvocation,
	postToCodeVitals,
	redactToken,
} from './post-to-codevitals.js';

const SCRIPTS_DIR = path.dirname( fileURLToPath( import.meta.url ) );
const LCP_KEY = 'wp-admin-dashboard-connection-sim-largestContentfulPaint';

/** Write a results fixture with the given median LCP and return its path. */
function writeResults( median ) {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-results-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'testhash', branch: 'trunk' },
			measurements: { jetpackConnected: { summary: { median } } },
		} )
	);
	return file;
}

/** Run a function with console output suppressed to keep test output readable. */
async function silenced( fn ) {
	const orig = { log: console.log, error: console.error, warn: console.warn };
	console.log = () => {};
	console.error = () => {};
	console.warn = () => {};
	try {
		return await fn();
	} finally {
		Object.assign( console, orig );
	}
}

// --- checkSanityRange (the guard) ---

test( 'in-range typed value passes', () => {
	assert.equal( checkSanityRange( 'lcp', 120 ).ok, true );
} );

test( 'range boundaries are inclusive', () => {
	assert.equal( checkSanityRange( 'lcp', 100 ).ok, true ); // min
	assert.equal( checkSanityRange( 'lcp', 60000 ).ok, true ); // max
} );

test( 'out-of-range value is rejected', () => {
	assert.equal( checkSanityRange( 'lcp', 99 ).ok, false ); // below min
	assert.equal( checkSanityRange( 'lcp', 60001 ).ok, false ); // above max
} );

test( 'a typed metric with no range row fails closed (typo / forgotten row)', () => {
	assert.equal( checkSanityRange( 'lcpp', 120 ).ok, false ); // typo
	assert.equal( checkSanityRange( 'LCP', 120 ).ok, false ); // case mismatch, lookup is exact
} );

test( 'non-finite values are rejected, including on min-0 ranges', () => {
	assert.equal( checkSanityRange( 'tbt', null ).ok, false ); // null coerces to 0; must not pass
	assert.equal( checkSanityRange( 'cls', null ).ok, false );
	assert.equal( checkSanityRange( 'lcp', NaN ).ok, false );
	assert.equal( checkSanityRange( 'lcp', Infinity ).ok, false );
	assert.equal( checkSanityRange( 'lcp', undefined ).ok, false );
} );

test( 'numeric strings are rejected rather than posted as strings', () => {
	assert.equal( checkSanityRange( 'lcp', '120' ).ok, false );
} );

test( 'a finite untyped legacy entry passes unchecked', () => {
	assert.equal( checkSanityRange( undefined, 999999 ).ok, true );
} );

test( 'a non-finite value is rejected even for an untyped legacy entry', () => {
	assert.equal( checkSanityRange( undefined, null ).ok, false );
	assert.equal( checkSanityRange( undefined, NaN ).ok, false );
} );

// --- extractScenarioMetrics ---

test( 'explicit metricKey yields one typed entry', () => {
	const entries = extractScenarioMetrics(
		{ metricKey: 'wp-admin-lcp', metricType: 'lcp' },
		{ median: 120 }
	);
	assert.deepEqual( entries, [ { key: 'wp-admin-lcp', value: 120, type: 'lcp' } ] );
} );

test( 'legacy prefix yields five untyped entries', () => {
	const entries = extractScenarioMetrics(
		{ metricPrefix: 'bar' },
		{ median: 1, mean: 2, min: 3, max: 4, stdDev: 5 }
	);
	assert.equal( entries.length, 5 );
	assert.deepEqual( entries[ 0 ], { key: 'bar_ms', value: 1 } );
	assert.equal(
		entries.every( e => e.type === undefined ),
		true
	);
} );

// --- redactToken (keeps the token out of logs and errors) ---

test( 'redactToken strips the exact token and any token query param', () => {
	assert.equal(
		redactToken( 'prefix token=abc123 suffix', 'abc123' ),
		'prefix token=REDACTED suffix'
	);
	assert.equal(
		redactToken( 'https://h/api/log?token=zzz&n=1' ),
		'https://h/api/log?token=REDACTED&n=1'
	);
	assert.equal( redactToken( 'no secret in here', 'abc123' ), 'no secret in here' );
} );

// --- postToCodeVitals (the accumulation loop + exit semantics) ---

test( 'dry-run posts an in-range metric into the payload, nothing rejected', async () => {
	const file = writeResults( 120 );
	const result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	assert.equal( result.posted, false ); // dry run never posts
	assert.equal( result.validationFailed, false );
	assert.equal( result.payload.metrics[ LCP_KEY ], 120 );
} );

test( 'an out-of-range metric is skipped and flags validationFailed', async () => {
	const file = writeResults( 70000 );
	const result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	assert.equal( result.posted, false );
	assert.equal( result.validationFailed, true ); // the only metric was rejected
} );

test( 'a non-finite metric is rejected through the posting path', async () => {
	const file = writeResults( null );
	const result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	assert.equal( result.validationFailed, true );
} );

test( 'a missing results file throws', async () => {
	await assert.rejects(
		() => silenced( () => postToCodeVitals( '/no/such/results.json', { dryRun: true } ) ),
		/Results file not found/
	);
} );

// --- live POST branch (fetch stubbed; never touches the network) ---

test( 'a live post sends the payload as POST and returns posted:true', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	let sentUrl, sentInit;
	global.fetch = async ( u, init ) => {
		sentUrl = u;
		sentInit = init;
		return { ok: true, status: 200, json: async () => ( { ok: true } ), text: async () => '' };
	};
	try {
		const result = await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-success',
			} )
		);
		assert.equal( result.posted, true );
		assert.equal( sentInit.method, 'POST' );
		assert.match( String( sentUrl ), /\/api\/log\?token=tok-success$/ );
		assert.equal( JSON.parse( sentInit.body ).metrics[ LCP_KEY ], 120 );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'a non-OK CodeVitals response throws without leaking the token', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	global.fetch = async () => ( { ok: false, status: 500, text: async () => 'upstream boom' } );
	try {
		await assert.rejects(
			() =>
				silenced( () =>
					postToCodeVitals( file, {
						dryRun: false,
						codeVitalsUrl: 'https://codevitals.test',
						codeVitalsToken: 'tok-secret-500',
					} )
				),
			err => {
				assert.match( err.message, /CodeVitals API error \(500\)/ );
				assert.ok( ! err.message.includes( 'tok-secret-500' ) );
				return true;
			}
		);
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'a malformed CODEVITALS_URL leaks the token into neither the error nor the logs', async () => {
	const file = writeResults( 120 );
	const captured = [];
	const orig = { log: console.log, error: console.error, warn: console.warn };
	console.log = () => {};
	console.warn = () => {};
	console.error = ( ...a ) => captured.push( a.join( ' ' ) );
	let thrown = '';
	try {
		await postToCodeVitals( file, {
			dryRun: false,
			codeVitalsUrl: 'http://[::1', // malformed on purpose
			codeVitalsToken: 'tok-must-not-leak',
		} );
	} catch ( e ) {
		thrown = e.message;
	} finally {
		Object.assign( console, orig );
	}
	assert.ok( ! thrown.includes( 'tok-must-not-leak' ), 'token must not be in the thrown message' );
	assert.ok(
		! captured.join( '\n' ).includes( 'tok-must-not-leak' ),
		'token must not be in console output'
	);
} );

test( 'a token-bearing upstream error is redacted in the message, the cause, and util.inspect', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// Simulate an upstream (e.g. undici) error that echoes the full request URL,
	// token included, in its message AND in a nested cause.
	global.fetch = async u => {
		const inner = new Error( `connect to ${ String( u ) } refused` );
		throw new Error( `request to ${ String( u ) } failed`, { cause: inner } );
	};
	let err;
	try {
		await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-cause-leak',
			} )
		);
	} catch ( e ) {
		err = e;
	} finally {
		global.fetch = origFetch;
	}
	assert.ok( err, 'the live post should reject' );
	assert.ok( ! err.message.includes( 'tok-cause-leak' ), 'token must not be in the message' );
	assert.ok(
		! ( err.cause?.message ?? '' ).includes( 'tok-cause-leak' ),
		'token must not be in the cause message'
	);
	assert.ok(
		! inspect( err, { depth: 5 } ).includes( 'tok-cause-leak' ),
		'token must not survive in util.inspect of the whole error'
	);
} );

// --- isDirectInvocation (the run-when-direct guard) ---

test( 'isDirectInvocation: a file matches itself', () => {
	const real = fileURLToPath( import.meta.url );
	assert.equal( isDirectInvocation( real, real ), true );
} );

test( 'isDirectInvocation: a non-existent invocation path is not a direct run', () => {
	assert.equal( isDirectInvocation( fileURLToPath( import.meta.url ), '/no/such/path' ), false );
} );

test( 'isDirectInvocation: a missing argv is not a direct run', () => {
	assert.equal( isDirectInvocation( fileURLToPath( import.meta.url ), undefined ), false );
} );

// --- CLI end to end (R2-C regression: must run from a path with a space) ---

test( 'the CLI runs main() when invoked directly from a path containing a space', () => {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv has space-' ) );
	fs.copyFileSync(
		path.join( SCRIPTS_DIR, 'post-to-codevitals.js' ),
		path.join( dir, 'post-to-codevitals.js' )
	);
	fs.copyFileSync( path.join( SCRIPTS_DIR, 'scenarios.js' ), path.join( dir, 'scenarios.js' ) );
	// Declare the temp copy as ESM. Without this, a `.js` file with `import` only
	// runs as a module on Node versions where syntax detection is on by default
	// (22.7+); on the lower half of this package's >=20.11 range it throws
	// "Cannot use import statement outside a module" and the test fails spuriously.
	fs.writeFileSync( path.join( dir, 'package.json' ), '{ "type": "module" }' );
	const results = writeResults( 120 );
	try {
		const out = execFileSync( 'node', [ path.join( dir, 'post-to-codevitals.js' ), '--dry-run' ], {
			encoding: 'utf8',
			env: { ...process.env, RESULTS_PATH: results },
		} );
		assert.match( out, /DRY RUN/ ); // empty output would mean main() was skipped
		assert.match( out, new RegExp( LCP_KEY ) );
	} finally {
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );
