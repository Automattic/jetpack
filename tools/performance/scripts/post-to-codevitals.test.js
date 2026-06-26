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
import {
	checkSanityRange,
	extractScenarioMetrics,
	isDirectInvocation,
	postToCodeVitals,
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
