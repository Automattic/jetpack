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
import { buildSummary, resolveResultsGit } from './measure-lcp.js';
import {
	checkSanityRange,
	exitCodeForError,
	extractScenarioMetrics,
	isDirectInvocation,
	pairedCommitTimestampMs,
	postToCodeVitals,
	redactToken,
	resolveDedupEnabled,
	resolvePostTimestamp,
	VALIDATION_FAILED_EXIT_CODE,
} from './post-to-codevitals.js';
import {
	getGitInfo,
	resolveCommitTimestampEnv,
	shouldFailBuildOnPostError,
} from './run-performance-tests.js';
import { SANITY_RANGES, SCENARIOS } from './scenarios.js';

const SCRIPTS_DIR = path.dirname( fileURLToPath( import.meta.url ) );
const LCP_KEY = 'wp-admin-dashboard-connection-sim-largestContentfulPaint';
const TTFB_KEY = 'wp-admin-dashboard-connection-sim-timeToFirstByte';
const FCP_KEY = 'wp-admin-dashboard-connection-sim-firstContentfulPaint';

/**
 * Build the nested per-field summary the multi-metric jetpackConnected scenario reads.
 * The poster reads summary.<field>.median for each metrics-array entry; the flat
 * top-level `median` mirrors LCP for the legacy metricKey path and older readers.
 */
function jetpackSummary( { lcp = 120, ttfb = 150, fcp = 400 } = {} ) {
	return {
		median: lcp, // flat LCP mirror (backward-compat)
		lcp: { median: lcp },
		ttfb: { median: ttfb },
		fcp: { median: fcp },
	};
}

/**
 * Write a results fixture and return its path. `median` is the LCP median (kept as the
 * first positional arg so existing single-arg call sites read the same); TTFB and FCP
 * default to in-range values so the two new metrics post cleanly unless overridden.
 */
function writeResults(
	median,
	{ ttfb = 150, fcp = 400, hash = 'testhash', branch = 'trunk' } = {}
) {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-results-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash, branch },
			measurements: {
				jetpackConnected: { summary: jetpackSummary( { lcp: median, ttfb, fcp } ) },
			},
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

// --- extractScenarioMetrics: the FORMS-707 multi-metric (metrics-array) path ---

test( 'a metrics array yields one typed entry per element, each from its own summary field', () => {
	const entries = extractScenarioMetrics(
		{
			key: 'multi',
			metrics: [
				{ field: 'lcp', codevitalsKey: 'k-lcp', type: 'lcp' },
				{ field: 'ttfb', codevitalsKey: 'k-ttfb', type: 'ttfb' },
				{ field: 'fcp', codevitalsKey: 'k-fcp', type: 'fcp' },
			],
		},
		{
			median: 120, // flat mirror — must NOT be read by the array path
			lcp: { median: 120 },
			ttfb: { median: 150 },
			fcp: { median: 400 },
		}
	);
	assert.deepEqual( entries, [
		{ key: 'k-lcp', value: 120, type: 'lcp' },
		{ key: 'k-ttfb', value: 150, type: 'ttfb' },
		{ key: 'k-fcp', value: 400, type: 'fcp' },
	] );
} );

test( 'a metrics-array entry missing its type fails closed (never posted unchecked)', () => {
	// Same fail-closed invariant as the single-metricKey path: a keyed metric with no type
	// would post any finite value to the append-only store, so extraction must throw instead.
	assert.throws(
		() =>
			extractScenarioMetrics(
				{
					key: 'multi',
					metrics: [
						{ field: 'lcp', codevitalsKey: 'k-lcp', type: 'lcp' },
						{ field: 'ttfb', codevitalsKey: 'k-ttfb' }, // no type
					],
				},
				{ lcp: { median: 120 }, ttfb: { median: 150 } }
			),
		err => {
			assert.equal( err.name, 'ValidationError' );
			assert.match( err.message, /no type/ );
			assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
			return true;
		}
	);
} );

test( 'a metrics-array entry missing its codevitalsKey fails closed (never posts under "undefined")', () => {
	// Same fail-closed invariant as the type guard: an entry with no key would post its value
	// under the literal key "undefined" — a permanent garbage point checkSanityRange can't
	// catch (it only inspects the value). Extraction must throw before any post.
	assert.throws(
		() =>
			extractScenarioMetrics(
				{
					key: 'multi',
					metrics: [
						{ field: 'lcp', codevitalsKey: 'k-lcp', type: 'lcp' },
						{ field: 'ttfb', type: 'ttfb' }, // no codevitalsKey
					],
				},
				{ lcp: { median: 120 }, ttfb: { median: 150 } }
			),
		err => {
			assert.equal( err.name, 'ValidationError' );
			assert.match( err.message, /no codevitalsKey/ );
			assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
			return true;
		}
	);
} );

test( 'a metrics array that repeats a CodeVitals key fails closed at extraction', () => {
	// A within-scenario duplicate key would post one value then clobber it. It is a config
	// bug (value-independent), so it must fail closed at extraction — before any value is
	// even read — not depend on the loop-level guard, which a skipped sanity check can bypass.
	assert.throws(
		() =>
			extractScenarioMetrics(
				{
					key: 'multi',
					metrics: [
						{ field: 'lcp', codevitalsKey: 'dup-key', type: 'lcp' },
						{ field: 'ttfb', codevitalsKey: 'dup-key', type: 'ttfb' }, // same key
					],
				},
				{ lcp: { median: 120 }, ttfb: { median: 150 } }
			),
		err => {
			assert.equal( err.name, 'ValidationError' );
			assert.match( err.message, /[Dd]uplicate/ );
			assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
			return true;
		}
	);
} );

test( 'a metrics-array entry with a missing summary field reads undefined (fails closed later, no crash)', () => {
	// A field absent from the summary (e.g. the browser never captured it) must yield
	// undefined — not crash on summary.<field>.median — so checkSanityRange rejects it.
	const entries = extractScenarioMetrics(
		{
			key: 'multi',
			metrics: [
				{ field: 'lcp', codevitalsKey: 'k-lcp', type: 'lcp' },
				{ field: 'ttfb', codevitalsKey: 'k-ttfb', type: 'ttfb' },
			],
		},
		{ lcp: { median: 120 } } // no ttfb block
	);
	assert.deepEqual( entries[ 1 ], { key: 'k-ttfb', value: undefined, type: 'ttfb' } );
	assert.equal( checkSanityRange( entries[ 1 ].type, entries[ 1 ].value ).ok, false );
} );

test( 'a keyed scenario without a metricType is rejected, not posted unchecked', () => {
	// Without this guard the entry would emit type:undefined and pass the range
	// check as a "legacy" metric — posting any finite value to an append-only store.
	assert.throws(
		() => extractScenarioMetrics( { key: 'future', metricKey: 'future-key' }, { median: 999999 } ),
		/metricKey but no metricType/
	);
} );

test( 'a scenario misconfiguration maps to the validation exit code, a transport error to 1', () => {
	let configError;
	try {
		extractScenarioMetrics( { key: 'future', metricKey: 'future-key' }, { median: 1 } );
	} catch ( e ) {
		configError = e;
	}
	// A keyed-without-metricType config error is local bad data: it must always fail
	// the build (the validation code), exactly like an out-of-range metric — never a
	// suppressible transport exit 1. Otherwise --allow-codevitals-failure could mask it.
	assert.equal( configError?.name, 'ValidationError' );
	assert.equal( exitCodeForError( configError ), VALIDATION_FAILED_EXIT_CODE );
	assert.equal( exitCodeForError( new Error( 'CodeVitals API error (500)' ) ), 1 );
} );

test( 'every posted keyed metric declares a type with a matching sanity range', () => {
	// Config contract for the real SCENARIOS: any scenario that posts a keyed metric — via a
	// single metricKey OR a metrics array — must declare a type that has a SANITY_RANGES row,
	// or it would post unchecked (or throw at extraction). Covers both the legacy single-key
	// shape and the FORMS-707 multi-metric shape, so neither can regress the fail-closed rule.
	const posted = SCENARIOS.filter(
		s => s.postToCodeVitals && ( s.metricKey || Array.isArray( s.metrics ) )
	);
	assert.ok( posted.length > 0, 'expected at least one posted keyed scenario' );
	for ( const scenario of posted ) {
		// Normalize both shapes to a list of { key, type } to assert on uniformly.
		const keyed = Array.isArray( scenario.metrics )
			? scenario.metrics.map( m => ( { key: m.codevitalsKey, type: m.type } ) )
			: [ { key: scenario.metricKey, type: scenario.metricType } ];
		for ( const { key, type } of keyed ) {
			const label = `${ scenario.key ?? key } → ${ key }`;
			assert.ok(
				typeof key === 'string' && key.trim(),
				`metric on scenario "${ scenario.key }" must declare a non-empty codevitalsKey`
			);
			assert.ok( type, `metric "${ label }" must declare a type` );
			assert.ok(
				SANITY_RANGES[ type ],
				`metric "${ label }" type "${ type }" needs a SANITY_RANGES row`
			);
		}
	}
} );

test( 'the jetpackConnected scenario posts LCP, TTFB and FCP to their production keys', () => {
	// Pins the FORMS-707 config: the dashboard scenario declares exactly the three production
	// keys, each reading its own summary field, so a future edit that drops or renames one
	// (or swaps in a -staging key) fails here rather than silently in production.
	const scenario = SCENARIOS.find( s => s.key === 'jetpackConnected' );
	assert.ok( Array.isArray( scenario.metrics ), 'jetpackConnected must use the metrics array' );
	assert.deepEqual(
		scenario.metrics.map( m => ( {
			field: m.field,
			codevitalsKey: m.codevitalsKey,
			type: m.type,
		} ) ),
		[
			{ field: 'lcp', codevitalsKey: LCP_KEY, type: 'lcp' },
			{ field: 'ttfb', codevitalsKey: TTFB_KEY, type: 'ttfb' },
			{ field: 'fcp', codevitalsKey: FCP_KEY, type: 'fcp' },
		]
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

test( 'dry-run posts all three scenario metrics into the payload, nothing rejected', async () => {
	const file = writeResults( 120, { ttfb: 150, fcp: 400 } );
	const result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	assert.equal( result.posted, false ); // dry run never posts
	assert.equal( result.validationFailed, false );
	// All three production keys, each from its own summary field; LCP unchanged.
	assert.equal( result.payload.metrics[ LCP_KEY ], 120 );
	assert.equal( result.payload.metrics[ TTFB_KEY ], 150 );
	assert.equal( result.payload.metrics[ FCP_KEY ], 400 );
	assert.equal( Object.keys( result.payload.metrics ).length, 3 );
} );

test( 'per-type sanity: one out-of-range metric is rejected, the survivors stay visible in the dry-run payload', async () => {
	// Each metric is checked against its OWN type: TTFB out of its range [10,10000] is
	// dropped while LCP and FCP survive into the dry-run payload, so CI diagnostics show
	// exactly which metrics passed. (A live run with validationFailed posts NOTHING — see
	// the atomic-post test below — so the partial payload is diagnostic-only.) The
	// rejected key must never reach the payload.
	const file = writeResults( 120, { ttfb: 99999, fcp: 400 } );
	const result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	assert.equal( result.validationFailed, true ); // ttfb failed its range
	assert.equal( result.payload.metrics[ LCP_KEY ], 120 ); // still posts
	assert.equal( result.payload.metrics[ FCP_KEY ], 400 ); // still posts
	assert.ok(
		! Object.prototype.hasOwnProperty.call( result.payload.metrics, TTFB_KEY ),
		'the out-of-range TTFB key must not appear in the payload'
	);
} );

test( 'a duplicate key within a scenario metrics array fails closed through the posting path', async () => {
	// End-to-end (not just at extraction): a scenario whose metrics array repeats a key must
	// exit 2 before anything posts, so the append-only store can't get a clobbered value.
	const dup = {
		key: 'dupArray',
		name: 'Dup Array',
		postToCodeVitals: true,
		metrics: [
			{ field: 'lcp', codevitalsKey: 'dup-array-key', type: 'lcp' },
			{ field: 'fcp', codevitalsKey: 'dup-array-key', type: 'fcp' }, // same key, twice
		],
	};
	SCENARIOS.push( dup );
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-duparr-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk' },
			measurements: {
				jetpackConnected: { summary: jetpackSummary() },
				dupArray: { summary: { lcp: { median: 120 }, fcp: { median: 400 } } },
			},
		} )
	);
	let err;
	try {
		await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	} catch ( e ) {
		err = e;
	} finally {
		SCENARIOS.pop();
		fs.rmSync( dir, { recursive: true, force: true } );
	}
	assert.ok( err, 'a duplicate key within a metrics array should reject' );
	assert.equal( err.name, 'ValidationError' );
	assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
	assert.match( err.message, /[Dd]uplicate/ );
} );

test( 'backward-compat: a legacy single metricKey scenario still posts unchanged', async () => {
	// FORMS-707 must not regress the legacy shape: a scenario with metricKey/metricType (no
	// metrics array) still extracts one typed entry from the flat summary.median and posts it.
	const legacy = {
		key: 'legacyKeyed',
		name: 'Legacy Keyed',
		postToCodeVitals: true,
		metricKey: 'legacy-single-key',
		metricType: 'lcp',
	};
	SCENARIOS.push( legacy );
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-legacy-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk' },
			measurements: {
				jetpackConnected: { summary: jetpackSummary() },
				legacyKeyed: { summary: { median: 250 } }, // flat summary.median, the legacy contract
			},
		} )
	);
	let result;
	try {
		result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	} finally {
		SCENARIOS.pop();
		fs.rmSync( dir, { recursive: true, force: true } );
	}
	assert.equal( result.validationFailed, false );
	assert.equal( result.payload.metrics[ 'legacy-single-key' ], 250 ); // read from flat summary.median
	assert.equal( result.payload.metrics[ LCP_KEY ], 120 ); // the array-path scenario still posts too
} );

test( 'a dry run never calls fetch, even with a malformed URL and a token set', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// Poison fetch: a dry run must short-circuit before any network call.
	global.fetch = async () => {
		throw new Error( 'fetch must not be called during a dry run' );
	};
	try {
		const result = await silenced( () =>
			postToCodeVitals( file, {
				dryRun: true,
				codeVitalsUrl: 'http://[::1', // malformed; must not even be constructed
				codeVitalsToken: 'tok-dry',
			} )
		);
		assert.equal( result.posted, false );
		assert.equal( result.payload.metrics[ LCP_KEY ], 120 );
	} finally {
		global.fetch = origFetch;
	}
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

test( 'a mixed valid/invalid run keeps the valid metric and excludes the rejected key from the payload', async () => {
	// The core contract, pinned on payload contents (not just the validationFailed flag):
	// an out-of-range metric is never in what would be posted, while a valid metric in the
	// same run still is. Reachable only with a 2nd posted metric (FORMS-707 territory).
	const extra = {
		key: 'extraMetric',
		name: 'Extra Metric',
		postToCodeVitals: true,
		metricKey: 'extra-metric-key',
		metricType: 'extratype',
	};
	SANITY_RANGES.extratype = { min: 0, max: 1000 };
	SCENARIOS.push( extra );
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-mixed-dry-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk' },
			measurements: {
				jetpackConnected: { summary: jetpackSummary() }, // valid LCP/TTFB/FCP → stay in payload
				extraMetric: { summary: { median: 99999 } }, // outside [0,1000] → rejected, excluded
			},
		} )
	);
	let result;
	try {
		result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	} finally {
		SCENARIOS.pop();
		delete SANITY_RANGES.extratype;
		fs.rmSync( dir, { recursive: true, force: true } );
	}
	assert.equal( result.validationFailed, true );
	assert.equal( result.payload.metrics[ LCP_KEY ], 120 ); // the valid metric is kept
	assert.ok(
		! Object.prototype.hasOwnProperty.call( result.payload.metrics, 'extra-metric-key' ),
		'the rejected metric key must not appear in the payload'
	);
} );

test( 'two scenarios posting the same CodeVitals key fail closed as a validation error', async () => {
	// CodeVitals appends to a per-key trend, so two scenarios writing the same key would
	// silently clobber one with the other and post a coin-flip survivor. That must fail
	// closed (exit 2), not slip through with validationFailed:false. Reachable once a 2nd
	// posted scenario exists (FORMS-707); guarded now so the foundation can't be misused.
	const dup = {
		key: 'dupMetric',
		name: 'Dup Metric',
		postToCodeVitals: true,
		metricKey: LCP_KEY, // collides with the real lcp scenario's key
		metricType: 'lcp',
	};
	SCENARIOS.push( dup );
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-dup-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk' },
			measurements: {
				jetpackConnected: { summary: jetpackSummary() },
				dupMetric: { summary: { median: 130 } },
			},
		} )
	);
	let err;
	try {
		await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
	} catch ( e ) {
		err = e;
	} finally {
		SCENARIOS.pop();
		fs.rmSync( dir, { recursive: true, force: true } );
	}
	assert.ok( err, 'a duplicate key should reject' );
	assert.equal( err.name, 'ValidationError' );
	assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
	assert.match( err.message, /[Dd]uplicate/ );
} );

test( 'a missing results file is a validation failure (exit 2), not a suppressible exit 1', async () => {
	await assert.rejects(
		() => silenced( () => postToCodeVitals( '/no/such/results.json', { dryRun: true } ) ),
		err => {
			assert.match( err.message, /Results file not found/ );
			// Pre-POST data failures must use the always-fatal data-integrity code.
			assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
			return true;
		}
	);
} );

test( 'a results file that is not valid JSON fails closed as a validation error (exit 2)', async () => {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-badjson-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync( file, '{ this is not valid json,,,' );
	try {
		await assert.rejects(
			() => silenced( () => postToCodeVitals( file, { dryRun: true } ) ),
			err => {
				assert.match( err.message, /not valid JSON/ );
				assert.equal( err.name, 'ValidationError' ); // not a raw SyntaxError
				assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
				return true;
			}
		);
	} finally {
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );

test( 'a results file with no measurements object fails closed as a validation error', async () => {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-noshape-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync( file, JSON.stringify( { git: { hash: 'h', branch: 'trunk' } } ) ); // no measurements
	try {
		await assert.rejects(
			() => silenced( () => postToCodeVitals( file, { dryRun: true } ) ),
			err => {
				assert.equal( err.name, 'ValidationError' ); // not a raw TypeError crash
				assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
				return true;
			}
		);
	} finally {
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );

test( 'a measurement with no summary is skipped, not a TypeError crash, and fails closed', async () => {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-nosummary-' ) );
	const file = path.join( dir, 'results.json' );
	// Measurement present, no error, but no summary object — must not crash on summary.median.
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk' },
			measurements: { jetpackConnected: {} },
		} )
	);
	try {
		await assert.rejects(
			() => silenced( () => postToCodeVitals( file, { dryRun: true } ) ),
			err => {
				assert.match( err.message, /No metrics to post/ );
				assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
				return true;
			}
		);
	} finally {
		fs.rmSync( dir, { recursive: true, force: true } );
	}
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

test( 'an OK response with an unparseable body is a transport failure (exit 1) and leaks no token', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// HTTP 200 but the body is not JSON; response.json() rejects with a token-bearing
	// error. This must surface as a transport/API failure (exit 1, suppressible), with
	// the token scrubbed from the message, the cause chain, and util.inspect.
	global.fetch = async () => ( {
		ok: true,
		status: 200,
		json: async () => {
			throw new Error( 'Unexpected token < for token=tok-json-500' );
		},
		text: async () => '<html>',
	} );
	let err;
	try {
		await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-json-500',
			} )
		);
	} catch ( e ) {
		err = e;
	} finally {
		global.fetch = origFetch;
	}
	assert.ok( err, 'an unparseable OK body should reject' );
	assert.match( err.message, /invalid JSON/ );
	assert.equal( exitCodeForError( err ), 1 ); // post reached transport; not a local-data failure
	assert.ok(
		! inspect( err, { depth: 5 } ).includes( 'tok-json-500' ),
		'token must not survive anywhere in the error'
	);
} );

test( 'a non-http(s) CODEVITALS_URL fails closed as a validation error (exit 2), never reaching fetch', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// A file:/ftp:/etc. base parses fine but must never reach fetch: a wrong scheme is a
	// local CODEVITALS_URL misconfiguration, so it has to exit 2 (unsuppressible), not the
	// generic exit 1 a fetch rejection would produce (which --allow-codevitals-failure hides).
	global.fetch = async () => {
		throw new Error( 'fetch must not be called for a non-http(s) URL' );
	};
	try {
		await assert.rejects(
			() =>
				silenced( () =>
					postToCodeVitals( file, {
						dryRun: false,
						codeVitalsUrl: 'file:///tmp/codevitals',
						codeVitalsToken: 'tok-file',
					} )
				),
			err => {
				assert.equal( err.name, 'ValidationError' );
				assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
				assert.match( err.message, /http\(s\)/ );
				return true;
			}
		);
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'a non-OK CodeVitals response throws without leaking the token, even from the body', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// A hostile/echoing error body that includes the token query param must still
	// be scrubbed everywhere, not just in the top-level message.
	global.fetch = async () => ( {
		ok: false,
		status: 500,
		text: async () => 'boom for token=tok-secret-500',
	} );
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
				assert.ok( ! err.message.includes( 'tok-secret-500' ), 'message must be scrubbed' );
				assert.ok(
					! ( err.cause?.message ?? '' ).includes( 'tok-secret-500' ),
					'cause must be scrubbed'
				);
				assert.ok(
					! inspect( err, { depth: 5 } ).includes( 'tok-secret-500' ),
					'util.inspect must be scrubbed'
				);
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
	let thrownErr;
	try {
		await postToCodeVitals( file, {
			dryRun: false,
			codeVitalsUrl: 'http://[::1', // malformed on purpose
			codeVitalsToken: 'tok-must-not-leak',
		} );
	} catch ( e ) {
		thrownErr = e;
	} finally {
		Object.assign( console, orig );
	}
	assert.ok(
		! thrownErr.message.includes( 'tok-must-not-leak' ),
		'token must not be in the thrown message'
	);
	assert.ok(
		! captured.join( '\n' ).includes( 'tok-must-not-leak' ),
		'token must not be in console output'
	);
	// A malformed base is local config, not a network outage: it must use the always-fatal
	// data-integrity code so --allow-codevitals-failure can never suppress it.
	assert.equal( thrownErr.name, 'ValidationError' );
	assert.equal( exitCodeForError( thrownErr ), VALIDATION_FAILED_EXIT_CODE );
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

test( 'a token on a custom error property (and nested cause) is scrubbed too', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// Native fetch never does this, but a non-native client might stash the
	// token-bearing URL on a custom field instead of (or besides) the message.
	global.fetch = async u => {
		const inner = new Error( 'socket closed' );
		inner.url = String( u ); // token-bearing, on a nested cause
		const outer = new Error( 'request failed', { cause: inner } );
		outer.requestUrl = String( u ); // token-bearing, on the top-level error
		throw outer;
	};
	let err;
	try {
		await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-on-prop',
			} )
		);
	} catch ( e ) {
		err = e;
	} finally {
		global.fetch = origFetch;
	}
	assert.ok( err, 'the live post should reject' );
	assert.ok(
		! inspect( err, { depth: 5 } ).includes( 'tok-on-prop' ),
		'token must not survive on any custom property across the cause chain'
	);
} );

test( 'a token-bearing primitive string cause is scrubbed too', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// `Error.cause` accepts any value. A non-native client may throw
	// `new Error( msg, { cause: someUrl } )` where the cause is a plain string, not an
	// Error. cause is non-enumerable, so this must be caught by the chain walk, not the
	// own-property pass — the gap this regression test pins.
	global.fetch = async u => {
		throw new Error( 'request failed', { cause: `connect to ${ String( u ) } refused` } );
	};
	let err;
	try {
		await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-string-cause',
			} )
		);
	} catch ( e ) {
		err = e;
	} finally {
		global.fetch = origFetch;
	}
	assert.ok( err, 'the live post should reject' );
	assert.ok(
		! inspect( err, { depth: 5 } ).includes( 'tok-string-cause' ),
		'token must not survive in a primitive string cause'
	);
} );

test( 'a native abort (DOMException with a getter-only message) does not crash redaction', async () => {
	const file = writeResults( 120 );
	const origFetch = global.fetch;
	// A real fetch timeout rejects with a DOMException whose `message` is getter-only;
	// scrubbing it must not throw a TypeError out of the catch (it carries no token).
	global.fetch = async () => {
		throw new DOMException( 'This operation was aborted', 'AbortError' );
	};
	let err;
	try {
		await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-abort',
			} )
		);
	} catch ( e ) {
		err = e;
	} finally {
		global.fetch = origFetch;
	}
	assert.ok( err, 'the live post should reject' );
	// The intended timeout message, not "Cannot set property message" from a failed write.
	assert.match( err.message, /timed out/ );
} );

// A response-body reader (json()/text()) that never settles on its own — only the fetch
// abort signal rejects it, the way undici aborts an in-flight body read. Proves the live-POST
// timer stays armed ACROSS the body read: if the production code cleared it after headers (the
// old shape), abort never fires, this hangs, and the per-test timeout fails instead of hanging
// forever. Mirrors dedupFetchStub's stallBodyUntilAbort for the live-POST path.
function bodyStallsUntilAbort( init ) {
	return new Promise( ( resolve, reject ) => {
		const abort = () => {
			const err = new Error( 'The operation was aborted' );
			err.name = 'AbortError';
			reject( err );
		};
		if ( init?.signal?.aborted ) {
			abort();
		} else {
			init?.signal?.addEventListener( 'abort', abort, { once: true } );
		}
	} );
}

test(
	'live POST body read stays bounded: a stalled OK json() body aborts to a timeout, not a hang',
	{ timeout: 20000 },
	async () => {
		// The live POST used to clear its abort timer right after fetch() resolved, leaving
		// response.json() unbounded — a server that sends 200 headers then stalls the body would
		// hang past the 30s timeout (undici's ~300s default at best). The timer now stays armed
		// through the body read, so the stalled json() aborts. postTimeoutMs=50 stands in for the
		// 30s production timer; the per-test timeout turns a reverted fix into a clean failure.
		const file = writeResults( 120 );
		const origFetch = global.fetch;
		global.fetch = async ( url, init ) => ( {
			ok: true,
			status: 200,
			text: async () => '',
			json: () => bodyStallsUntilAbort( init ),
		} );
		let err;
		try {
			await silenced( () =>
				postToCodeVitals( file, {
					dryRun: false,
					codeVitalsUrl: 'https://codevitals.test',
					codeVitalsToken: 'tok-stall-ok',
					postTimeoutMs: 50,
				} )
			);
		} catch ( e ) {
			err = e;
		} finally {
			global.fetch = origFetch;
		}
		assert.ok( err, 'a stalled OK body must abort, not hang' );
		assert.match( err.message, /timed out/, 'a body-read abort is a timeout, not "invalid JSON"' );
	}
);

test(
	'live POST body read stays bounded: a stalled non-OK text() body aborts to a timeout, not a hang',
	{ timeout: 20000 },
	async () => {
		// Same regression guard on the error branch: a non-OK response reads response.text() for
		// the error message, and that read must be bounded by the same armed timer. A 500 whose
		// body stalls aborts cleanly instead of hanging.
		const file = writeResults( 120 );
		const origFetch = global.fetch;
		global.fetch = async ( url, init ) => ( {
			ok: false,
			status: 500,
			json: async () => ( {} ),
			text: () => bodyStallsUntilAbort( init ),
		} );
		let err;
		try {
			await silenced( () =>
				postToCodeVitals( file, {
					dryRun: false,
					codeVitalsUrl: 'https://codevitals.test',
					codeVitalsToken: 'tok-stall-err',
					postTimeoutMs: 50,
				} )
			);
		} catch ( e ) {
			err = e;
		} finally {
			global.fetch = origFetch;
		}
		assert.ok( err, 'a stalled error body must abort, not hang' );
		assert.match( err.message, /timed out/ );
	}
);

test( 'a sanity-check failure suppresses the live POST entirely (atomic per-run posting)', async () => {
	// Reachable only with 2+ posted metrics (FORMS-707 territory): one metric fails the
	// sanity check (validationFailed=true) while valid survivors remain. The run is
	// already committed to exit 2, and CodeVitals is append-only with dedup off by
	// default — so POSTing the survivors would re-append them as duplicate trend points
	// when the red build is retried. The live path must post NOTHING: fetch is never
	// called, and the result still carries validationFailed for main()'s exit-2 mapping.
	const extra = {
		key: 'extraMetric',
		name: 'Extra Metric',
		postToCodeVitals: true,
		metricKey: 'extra-metric-key',
		metricType: 'extratype',
	};
	SANITY_RANGES.extratype = { min: 0, max: 1000 };
	SCENARIOS.push( extra );
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-mixed-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk' },
			measurements: {
				jetpackConnected: { summary: jetpackSummary() }, // valid LCP/TTFB/FCP survivors
				extraMetric: { summary: { median: 99999 } }, // outside [0,1000] → skipped, flags validationFailed
			},
		} )
	);
	const origFetch = global.fetch;
	let fetchCalls = 0;
	global.fetch = async () => {
		fetchCalls++;
		return { ok: true, status: 200, json: async () => ( {} ) };
	};
	let result;
	try {
		result = await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-mixed',
			} )
		);
	} finally {
		global.fetch = origFetch;
		SCENARIOS.pop();
		delete SANITY_RANGES.extratype;
		fs.rmSync( dir, { recursive: true, force: true } );
	}
	assert.equal( fetchCalls, 0, 'a run with a validation failure must never reach fetch' );
	assert.equal( result.posted, false );
	// main() maps this to the always-fatal data-integrity exit 2, which
	// --allow-codevitals-failure can never suppress.
	assert.equal( result.validationFailed, true );
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

test( 'the CLI exits with the validation code on an out-of-range dry run', () => {
	const results = writeResults( 70000 ); // LCP far outside [100, 60000]
	const env = { ...process.env, RESULTS_PATH: results };
	delete env.CODEVITALS_TOKEN; // a dry run needs no token; prove it still fails closed
	let status, output;
	try {
		execFileSync( 'node', [ path.join( SCRIPTS_DIR, 'post-to-codevitals.js' ), '--dry-run' ], {
			encoding: 'utf8',
			env,
			stdio: [ 'ignore', 'pipe', 'pipe' ],
		} );
		status = 0;
	} catch ( err ) {
		status = err.status;
		output = `${ err.stdout ?? '' }${ err.stderr ?? '' }`;
	}
	// CI keys on the exit code; an out-of-range metric must use the data-integrity
	// code (not a generic 1) so the runner can never suppress it.
	assert.equal( status, VALIDATION_FAILED_EXIT_CODE );
	assert.match( output, /Sanity check failed/ );
} );

test( 'the CLI exits with the validation code when there are no metrics to post', () => {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-empty-' ) );
	const file = path.join( dir, 'results.json' );
	// A well-formed results file with no usable measurements: nothing posts. This is a
	// local data-integrity failure, so it must exit 2 (unsuppressible), not a generic 1.
	fs.writeFileSync(
		file,
		JSON.stringify( { git: { hash: 'h', branch: 'trunk' }, measurements: {} } )
	);
	const env = { ...process.env, RESULTS_PATH: file };
	delete env.CODEVITALS_TOKEN;
	let status, output;
	try {
		execFileSync( 'node', [ path.join( SCRIPTS_DIR, 'post-to-codevitals.js' ), '--dry-run' ], {
			encoding: 'utf8',
			env,
			stdio: [ 'ignore', 'pipe', 'pipe' ],
		} );
		status = 0;
	} catch ( err ) {
		status = err.status;
		output = `${ err.stdout ?? '' }${ err.stderr ?? '' }`;
	} finally {
		fs.rmSync( dir, { recursive: true, force: true } );
	}
	assert.equal( status, VALIDATION_FAILED_EXIT_CODE );
	assert.match( output, /No metrics to post/ );
} );

// --- run-performance-tests.js: the build-fail decision (cross-file contract) ---
// The poster sets the exit code; the runner decides whether it fails the build.
// These pin that the validation/outage split survives a future runner refactor.

test( 'shouldFailBuildOnPostError: a validation failure (exit 2) is always fatal', () => {
	const validation = { status: VALIDATION_FAILED_EXIT_CODE };
	// Even with --allow-codevitals-failure set, local bad data must fail the build.
	assert.equal( shouldFailBuildOnPostError( validation, true ), true );
	assert.equal( shouldFailBuildOnPostError( validation, false ), true );
} );

test( 'shouldFailBuildOnPostError: a transport failure is suppressible only with the flag', () => {
	assert.equal( shouldFailBuildOnPostError( { status: 1 }, true ), false ); // outage tolerated
	assert.equal( shouldFailBuildOnPostError( { status: 1 }, false ), true ); // fatal by default
	assert.equal( shouldFailBuildOnPostError( undefined, true ), false ); // unknown exit, flag set
	assert.equal( shouldFailBuildOnPostError( undefined, false ), true );
} );

// --- resolvePostTimestamp (stamp commit time, not build time) ---

test( 'resolvePostTimestamp prefers the results commit time over env and build time', () => {
	const ts = resolvePostTimestamp(
		{ git: { timestamp: 1700000000000 } },
		{ commitTimestampMs: '1600000000000' }
	);
	assert.equal( ts, 1700000000000 );
} );

test( 'resolvePostTimestamp falls back to the env commit time (numeric string ok)', () => {
	const ts = resolvePostTimestamp( { git: {} }, { commitTimestampMs: '1600000000000' } );
	assert.equal( ts, 1600000000000 );
} );

test( 'resolvePostTimestamp drops the env commit time when the results file names a different commit', async () => {
	const before = Date.now();
	// A stale results file (hash but no timestamp) plus an inherited env pair for a
	// DIFFERENT commit: the env timestamp must not stamp the results-file hash, so the
	// poster falls back to build time (with the warning) instead of mixing provenance.
	const ts = await silenced( () =>
		resolvePostTimestamp(
			{ git: { hash: 'results-hash' } },
			{ gitHash: 'env-hash', commitTimestampMs: '1600000000000' }
		)
	);
	assert.notEqual( ts, 1600000000000, 'the mismatched env timestamp is not posted' );
	assert.ok( ts >= before && ts <= Date.now() + 1000, 'falls back to build time' );
} );

test( 'resolvePostTimestamp keeps the env commit time when it matches the posted hash', () => {
	// Same hash on both sides (the normal runner handoff): the env pair is provenance-safe.
	assert.equal(
		resolvePostTimestamp(
			{ git: { hash: 'same-hash' } },
			{ gitHash: 'same-hash', commitTimestampMs: '1600000000000' }
		),
		1600000000000
	);
} );

test( 'resolvePostTimestamp rejects non-positive / non-numeric values and uses build time', async () => {
	const before = Date.now();
	// git.timestamp 0 and a non-numeric env value are both invalid → build-time fallback.
	const ts = await silenced( () =>
		resolvePostTimestamp( { git: { timestamp: 0 } }, { commitTimestampMs: 'not-a-number' } )
	);
	assert.ok( ts >= before && ts <= Date.now() + 1000, 'falls back to the current time' );
	// A negative epoch must never be posted, even if present.
	const fromNegative = await silenced( () =>
		resolvePostTimestamp( { git: { timestamp: -5 } }, {} )
	);
	assert.ok( fromNegative > 0, 'a negative timestamp is rejected in favour of build time' );
} );

test( 'resolvePostTimestamp rejects unit errors (epoch seconds, micro/nanoseconds) as implausible', async () => {
	const before = Date.now();
	// A 10-digit epoch-*seconds* value (e.g. 1700000000) would post as 1970-01-20 if taken
	// as ms. It must be rejected, not silently backdated into the append-only trend.
	const fromSeconds = await silenced( () =>
		resolvePostTimestamp( { git: { timestamp: 1700000000 } }, {} )
	);
	assert.notEqual( fromSeconds, 1700000000, 'epoch-seconds value is not posted verbatim' );
	assert.ok(
		fromSeconds >= before && fromSeconds <= Date.now() + 1000,
		'an epoch-seconds value falls back to build time'
	);
	// Micro/nanosecond magnitudes are far in the future and equally implausible as ms.
	const fromMicros = await silenced( () =>
		resolvePostTimestamp( { git: {} }, { commitTimestampMs: '1700000000000000' } )
	);
	assert.ok(
		fromMicros >= before && fromMicros <= Date.now() + 1000,
		'a microsecond-magnitude value falls back to build time'
	);
	// A real epoch-ms value at the window edges is still accepted unchanged.
	assert.equal(
		resolvePostTimestamp( { git: { timestamp: 1_000_000_000_000 } }, {} ),
		1_000_000_000_000,
		'a plausible epoch-ms value passes through'
	);
} );

test( 'a dry-run payload is stamped with the commit time from the results file', async () => {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-ts-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk', timestamp: 1700000000000 },
			measurements: { jetpackConnected: { summary: jetpackSummary() } },
		} )
	);
	try {
		const result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
		assert.equal( result.payload.timestamp, 1700000000000 );
	} finally {
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );

// --- buildSummary (measure-lcp per-field aggregation; the load-bearing FORMS-707 change) ---

test( 'buildSummary aggregates every field into its own block and mirrors LCP flat', () => {
	// Each field gets a nested { median, mean, min, max, stdDev } block, and the LCP block is
	// ALSO mirrored flat on the summary root so the poster's legacy metricKey path and older
	// readers of summary.median keep working. TTFB/FCP are aggregated for the first time here.
	const results = [
		{ lcp: 100, metrics: { lcp: 100, ttfb: 50, fcp: 200 } },
		{ lcp: 200, metrics: { lcp: 200, ttfb: 70, fcp: 400 } },
		{ lcp: 300, metrics: { lcp: 300, ttfb: 90, fcp: 600 } },
	];
	const summary = buildSummary( results, 3 );

	// Nested per-field blocks (what the multi-metric poster path reads: summary.<field>.median).
	assert.deepEqual( summary.lcp, { median: 200, mean: 200, min: 100, max: 300, stdDev: 82 } );
	assert.equal( summary.ttfb.median, 70 );
	assert.equal( summary.fcp.median, 400 );
	assert.equal( summary.fcp.min, 200 );
	assert.equal( summary.fcp.max, 600 );

	// Flat top-level mirror of LCP (backward-compat) — byte-for-byte the old LCP-only summary.
	assert.equal( summary.median, 200 );
	assert.equal( summary.mean, 200 );
	assert.equal( summary.min, 100 );
	assert.equal( summary.max, 300 );
	assert.equal( summary.stdDev, 82 );

	// Iteration counters preserved.
	assert.equal( summary.successfulIterations, 3 );
	assert.equal( summary.totalIterations, 3 );
} );

test( 'buildSummary flat LCP mirror matches the old LCP-only summary exactly', () => {
	// Pins that LCP stays byte-for-byte: same value source (r.lcp), same rounding, same number.
	const lcpValues = [ 111, 222, 333, 444 ];
	const results = lcpValues.map( lcp => ( { lcp, metrics: { lcp, ttfb: 40, fcp: 300 } } ) );
	const summary = buildSummary( results, 4 );
	assert.equal( summary.median, 278 ); // (222+333)/2 = 277.5 → round 278
	assert.equal( summary.min, 111 );
	assert.equal( summary.max, 444 );
	assert.equal( summary.lcp.median, summary.median ); // nested and flat agree
} );

test( 'buildSummary omits a field with no finite samples so the poster fails closed', () => {
	// A field the browser never captured (all null) must be omitted — not a fabricated 0 —
	// so extractScenarioMetrics reads undefined and checkSanityRange rejects it downstream.
	const results = [
		{ lcp: 100, metrics: { lcp: 100, ttfb: null, fcp: 200 } },
		{ lcp: 200, metrics: { lcp: 200, ttfb: null, fcp: 400 } },
	];
	const summary = buildSummary( results, 2 );
	assert.equal( summary.ttfb, undefined, 'no finite TTFB sample → omitted, not 0' );
	assert.ok( summary.lcp && summary.fcp, 'fields with samples are still aggregated' );
	assert.equal( summary.median, 150 ); // flat LCP mirror still present
} );

test( 'buildSummary drops individual non-finite samples before aggregating a field', () => {
	// A field present on some iterations but null on others aggregates only the finite ones.
	const results = [
		{ lcp: 100, metrics: { lcp: 100, ttfb: 60, fcp: 200 } },
		{ lcp: 200, metrics: { lcp: 200, ttfb: null, fcp: 400 } }, // ttfb missing this run
		{ lcp: 300, metrics: { lcp: 300, ttfb: 80, fcp: 600 } },
	];
	const summary = buildSummary( results, 3 );
	assert.equal( summary.ttfb.median, 70 ); // median of [60, 80], the null dropped
	assert.equal( summary.ttfb.min, 60 );
	assert.equal( summary.ttfb.max, 80 );
} );

// --- commit-time plumbing: getGitInfo reads the producer side (real temp git repo) ---

/**
 * Make a throwaway git repo with one commit and return its dir. `body` becomes the
 * commit message body (used to exercise Upstream-Ref parsing). Caller removes the dir.
 */
function initTempGitRepo( body = '' ) {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-git-' ) );
	const git = args => execFileSync( 'git', args, { cwd: dir, stdio: 'pipe' } );
	git( [ 'init', '-q', '-b', 'trunk' ] );
	git( [ 'config', 'user.email', 't@example.com' ] );
	git( [ 'config', 'user.name', 'Test' ] );
	git( [ 'config', 'commit.gpgsign', 'false' ] );
	fs.writeFileSync( path.join( dir, 'file.txt' ), 'x' );
	git( [ 'add', '-A' ] );
	git( [ 'commit', '-q', '-m', 'subject', ...( body ? [ '-m', body ] : [] ) ] );
	return dir;
}

test( 'getGitInfo: plain commit → hash is mirror HEAD and committedAtMs is %ct × 1000', () => {
	const savedCommit = process.env.GIT_COMMIT;
	delete process.env.GIT_COMMIT; // don't let the host env override hash selection
	const dir = initTempGitRepo();
	try {
		const head = execFileSync( 'git', [ 'rev-parse', 'HEAD' ], { cwd: dir, stdio: 'pipe' } )
			.toString()
			.trim();
		const ct = Number(
			execFileSync( 'git', [ 'show', '-s', '--format=%ct', 'HEAD' ], { cwd: dir, stdio: 'pipe' } )
				.toString()
				.trim()
		);
		const info = getGitInfo( dir );
		assert.equal( info.hash, head );
		assert.equal( info.mirrorHash, head );
		assert.equal( info.branch, 'trunk' );
		assert.equal( info.committedAtMs, ct * 1000, 'commit time is epoch seconds × 1000' );
	} finally {
		if ( savedCommit === undefined ) {
			delete process.env.GIT_COMMIT;
		} else {
			process.env.GIT_COMMIT = savedCommit;
		}
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );

test( 'getGitInfo: an Upstream-Ref footer wins over the mirror hash (monorepo SHA is posted)', () => {
	const savedCommit = process.env.GIT_COMMIT;
	delete process.env.GIT_COMMIT;
	const upstream = 'a'.repeat( 40 );
	const dir = initTempGitRepo( `Upstream-Ref: Automattic/jetpack@${ upstream }` );
	try {
		const head = execFileSync( 'git', [ 'rev-parse', 'HEAD' ], { cwd: dir, stdio: 'pipe' } )
			.toString()
			.trim();
		const info = getGitInfo( dir );
		assert.equal( info.hash, upstream, 'hash comes from the Upstream-Ref, not mirror HEAD' );
		assert.equal( info.mirrorHash, head, 'mirrorHash still tracks the real checkout' );
		assert.ok( info.committedAtMs > 0 );
	} finally {
		if ( savedCommit === undefined ) {
			delete process.env.GIT_COMMIT;
		} else {
			process.env.GIT_COMMIT = savedCommit;
		}
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );

test( 'getGitInfo: a non-git directory degrades to unknown hash and null commit time', () => {
	const savedCommit = process.env.GIT_COMMIT;
	delete process.env.GIT_COMMIT;
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-nogit-' ) );
	try {
		const info = getGitInfo( dir );
		assert.equal( info.hash, 'unknown' );
		assert.equal( info.mirrorHash, 'unknown' );
		assert.equal(
			info.committedAtMs,
			null,
			'no git metadata → null, so the poster build-time falls back'
		);
	} finally {
		if ( savedCommit === undefined ) {
			delete process.env.GIT_COMMIT;
		} else {
			process.env.GIT_COMMIT = savedCommit;
		}
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );

// --- resolveCommitTimestampEnv (GIT_COMMIT + GIT_COMMIT_TIMESTAMP_MS are a paired override) ---

test( 'resolveCommitTimestampEnv: paired override honored, lone timestamp dropped, source surfaced', () => {
	const headInfo = { committedAtMs: 1700000000000 };

	// Paired override (both env vars set): the caller-supplied timestamp wins, no warning.
	const paired = resolveCommitTimestampEnv( headInfo, {
		GIT_COMMIT: 'deadbeef',
		GIT_COMMIT_TIMESTAMP_MS: '1600000000000',
	} );
	assert.equal( paired.value, '1600000000000' );
	assert.equal( paired.warn, false );

	// Lone GIT_COMMIT_TIMESTAMP_MS (no hash override) is orphaned → dropped for HEAD time,
	// so it can't stamp HEAD's hash with an unrelated time. This is R4-IMPORTANT-1.
	const lone = resolveCommitTimestampEnv( headInfo, { GIT_COMMIT_TIMESTAMP_MS: '999' } );
	assert.equal( lone.value, '1700000000000', 'a lone timestamp does not win over HEAD time' );
	assert.equal( lone.warn, false );

	// Empty-string timestamp counts as absent, not a paired override.
	const empty = resolveCommitTimestampEnv( headInfo, {
		GIT_COMMIT: 'deadbeef',
		GIT_COMMIT_TIMESTAMP_MS: '',
	} );
	assert.equal( empty.value, '1700000000000' );

	// Hash override with no paired timestamp gets HEAD time but flags the provenance split.
	const hashOnly = resolveCommitTimestampEnv( headInfo, { GIT_COMMIT: 'deadbeef' } );
	assert.equal( hashOnly.value, '1700000000000' );
	assert.equal( hashOnly.warn, true, 'an unpaired hash override warns about the split' );

	// No env at all: plain HEAD time, no warning.
	const plain = resolveCommitTimestampEnv( headInfo, {} );
	assert.equal( plain.value, '1700000000000' );
	assert.equal( plain.warn, false );

	// No HEAD metadata and no paired override → null (caller unsets so the poster falls
	// back to build time); a lone orphaned timestamp is still not trusted here.
	assert.equal( resolveCommitTimestampEnv( { committedAtMs: null }, {} ).value, null );
	assert.equal(
		resolveCommitTimestampEnv( { committedAtMs: null }, { GIT_COMMIT_TIMESTAMP_MS: '999' } ).value,
		null,
		'a lone timestamp is dropped even when there is no HEAD time to fall back to'
	);
} );

test( 'resolveResultsGit: the dominant channel pairs the commit time with GIT_COMMIT', () => {
	// Paired (hash + time): both are written, as a coherent pair.
	assert.deepEqual(
		resolveResultsGit( {
			GIT_COMMIT: 'deadbeef',
			GIT_BRANCH: 'trunk',
			GIT_COMMIT_TIMESTAMP_MS: '1600000000000',
		} ),
		{ hash: 'deadbeef', branch: 'trunk', timestamp: 1600000000000 }
	);
	// Lone GIT_COMMIT_TIMESTAMP_MS (no hash): the stale time is DROPPED so it can't be
	// written into results.git.timestamp and backdate the trend (the poster prefers this
	// value over its own guarded env fallback). This is R6-IMPORTANT-1, the dominant channel.
	assert.deepEqual( resolveResultsGit( { GIT_COMMIT_TIMESTAMP_MS: '1600000000000' } ), {
		hash: 'unknown',
		branch: 'unknown',
		timestamp: undefined,
	} );
	// Hash override with no paired time: hash written, time omitted (poster build-time falls back).
	assert.equal( resolveResultsGit( { GIT_COMMIT: 'deadbeef' } ).timestamp, undefined );
	// Paired but non-numeric time → dropped, not NaN.
	assert.equal(
		resolveResultsGit( { GIT_COMMIT: 'deadbeef', GIT_COMMIT_TIMESTAMP_MS: 'nope' } ).timestamp,
		undefined
	);
} );

test( 'pairedCommitTimestampMs: the env timestamp is trusted only when paired with GIT_COMMIT', () => {
	// Paired override (both set): the env timestamp is carried into config.
	assert.equal(
		pairedCommitTimestampMs( { GIT_COMMIT: 'deadbeef', GIT_COMMIT_TIMESTAMP_MS: '1600000000000' } ),
		'1600000000000'
	);
	// Lone GIT_COMMIT_TIMESTAMP_MS (no hash override) is dropped — it can't backdate a
	// direct `pnpm report` run by stamping the results-file hash with an inherited time.
	assert.equal(
		pairedCommitTimestampMs( { GIT_COMMIT_TIMESTAMP_MS: '1600000000000' } ),
		undefined
	);
	// Nothing set: undefined (resolvePostTimestamp uses results.git.timestamp / build time).
	assert.equal( pairedCommitTimestampMs( {} ), undefined );
} );

// --- cross-commit dedup (gitaudit evolution read; fetch stubbed, no network) ---

const DEDUP_CONFIG = {
	dryRun: false,
	codeVitalsUrl: 'https://codevitals.test',
	codeVitalsToken: 'tok-dedup',
	dedupBaseUrl: 'https://gitaudit.test',
	dedupRepo: 'Automattic/jetpack',
	dedupMetricId: '58',
};

/**
 * A fetch stub that answers the dedup evolution GET ({ data: [...] }) and records
 * whether the live POST was reached. Branches on the URL: the evolution read
 * contains `/perf/evolution/`, the post contains `/api/log`.
 */
function dedupFetchStub( {
	evolutionHashes = [],
	evolutionStatus = 200,
	throwOnEvolution = false,
	rejectBody = false, // headers arrive OK but json() rejects synchronously (truncated body)
	stallBodyUntilAbort = false, // headers arrive OK but json() settles only when init.signal aborts
	evolutionBody, // when set, returned verbatim from the evolution json() (for bad-shape tests)
} ) {
	const calls = { evolution: 0, post: 0, evolutionUrl: null };
	const fetchImpl = async ( u, init ) => {
		if ( String( u ).includes( '/perf/evolution/' ) ) {
			calls.evolution++;
			calls.evolutionUrl = String( u );
			if ( throwOnEvolution ) {
				throw new Error( 'network down' );
			}
			return {
				ok: evolutionStatus >= 200 && evolutionStatus < 300,
				status: evolutionStatus,
				json: async () => {
					if ( rejectBody ) {
						throw new Error( 'body read failed' );
					}
					if ( stallBodyUntilAbort ) {
						// Never settle on our own: only the abort signal rejects this, the way
						// undici aborts an in-flight body read. This passes ONLY if the abort
						// timer is still armed across json() — if the production code cleared it
						// after the headers (the reverted-fix shape), abort never fires, this
						// promise hangs, and the test times out (the regression we want to catch).
						return new Promise( ( resolve, reject ) => {
							const abort = () => {
								const err = new Error( 'The operation was aborted' );
								err.name = 'AbortError';
								reject( err );
							};
							if ( init?.signal?.aborted ) {
								abort();
							} else {
								init?.signal?.addEventListener( 'abort', abort, { once: true } );
							}
						} );
					}
					return evolutionBody !== undefined
						? evolutionBody
						: { data: evolutionHashes.map( h => ( { hash: h, measuredAt: '2026-01-01' } ) ) };
				},
				text: async () => '',
			};
		}
		calls.post++;
		return { ok: true, status: 200, json: async () => ( { ok: true } ), text: async () => '' };
	};
	return { fetchImpl, calls };
}

test( 'resolveDedupEnabled: dedup is opt-in (off by default) and an explicit opt-out always wins', () => {
	const noEnv = {};
	// Default: OFF, the safe default until the dedup read and write backends match.
	assert.equal( resolveDedupEnabled( [], noEnv ), false );
	// Opt in by flag or a truthy env value.
	assert.equal( resolveDedupEnabled( [ '--dedup' ], noEnv ), true );
	assert.equal( resolveDedupEnabled( [], { CODEVITALS_ENABLE_DEDUP: '1' } ), true );
	assert.equal( resolveDedupEnabled( [], { CODEVITALS_ENABLE_DEDUP: 'true' } ), true );
	// A non-truthy env value does not enable.
	assert.equal( resolveDedupEnabled( [], { CODEVITALS_ENABLE_DEDUP: '0' } ), false );
	assert.equal( resolveDedupEnabled( [], { CODEVITALS_ENABLE_DEDUP: 'no' } ), false );
	// Opt-out wins over opt-in, whichever side it comes from.
	assert.equal( resolveDedupEnabled( [ '--dedup', '--no-dedup' ], noEnv ), false );
	assert.equal( resolveDedupEnabled( [ '--dedup' ], { CODEVITALS_SKIP_DEDUP: '1' } ), false );
	assert.equal(
		resolveDedupEnabled( [], { CODEVITALS_ENABLE_DEDUP: '1', CODEVITALS_SKIP_DEDUP: 'yes' } ),
		false
	);
} );

test( 'dedup skips the post when the commit hash already has metrics', async () => {
	const file = writeResults( 120 ); // git.hash = 'testhash'
	const { fetchImpl, calls } = dedupFetchStub( { evolutionHashes: [ 'testhash' ] } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		assert.equal( result.posted, false );
		assert.equal( result.skipped, true );
		assert.equal( calls.evolution, 1 );
		assert.equal( calls.post, 0, 'must not POST when the hash is already present' );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'dedup proceeds with the post when the hash is not yet present', async () => {
	const file = writeResults( 120 );
	const { fetchImpl, calls } = dedupFetchStub( { evolutionHashes: [ 'someoneelse' ] } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		assert.equal( result.posted, true );
		assert.equal( calls.post, 1 );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'dedup fails open (still posts) when the read endpoint throws', async () => {
	const file = writeResults( 120 );
	const { fetchImpl, calls } = dedupFetchStub( { throwOnEvolution: true } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		assert.equal( result.posted, true, 'a flaky dedup read must never block a post' );
		assert.equal( calls.post, 1 );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'dedup fails open on a non-OK read status', async () => {
	const file = writeResults( 120 );
	const { fetchImpl, calls } = dedupFetchStub( { evolutionStatus: 500 } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		assert.equal( result.posted, true );
		assert.equal( calls.post, 1 );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'dedup fails open (still posts) when the response body read fails', async () => {
	// Headers arrive OK but json() rejects — a truncated/stalled body, or a server that
	// answers headers then dies. The abort timer stays armed across the body read (so a
	// real stall is bounded by the 15s abort, not undici's ~300s default), and the
	// rejection is caught and turned into a fail-open. The post must still happen.
	const file = writeResults( 120 );
	const { fetchImpl, calls } = dedupFetchStub( { rejectBody: true } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		assert.equal( result.posted, true, 'a failed body read must never block a post' );
		assert.equal( calls.post, 1 );
	} finally {
		global.fetch = origFetch;
	}
} );

test(
	'dedup body read stays bounded: a body that hangs until abort still fails open and posts',
	{ timeout: 20000 },
	async () => {
		// The regression guard for the round-2 body-read fix: the abort timer must stay
		// armed across response.json(). The stub's json() never settles on its own — only
		// the AbortController signal rejects it — so this passes only if the timer is still
		// live during the body read. dedupTimeoutMs=50 stands in for the 15s production
		// timer; the per-test timeout turns a reverted fix (timer cleared after headers,
		// abort never fires, json() hangs) into a clean failure instead of a hang. The
		// budget is deliberately wide (~400x the 50ms abort) so a cold `node --test`
		// warmup can't false-fail correct code; only a genuine hang reaches 20s.
		const file = writeResults( 120 );
		const { fetchImpl, calls } = dedupFetchStub( { stallBodyUntilAbort: true } );
		const origFetch = global.fetch;
		global.fetch = fetchImpl;
		try {
			const result = await silenced( () =>
				postToCodeVitals( file, { ...DEDUP_CONFIG, dedupTimeoutMs: 50 } )
			);
			assert.equal( result.posted, true, 'a stalled body read must abort and fail open, not hang' );
			assert.equal( calls.post, 1 );
		} finally {
			global.fetch = origFetch;
		}
	}
);

test( 'dedup makes no read call when skipDedup is set', async () => {
	const file = writeResults( 120 );
	const { fetchImpl, calls } = dedupFetchStub( { evolutionHashes: [ 'testhash' ] } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () =>
			postToCodeVitals( file, { ...DEDUP_CONFIG, skipDedup: true } )
		);
		assert.equal( calls.evolution, 0, 'no dedup read when skipDedup is set' );
		assert.equal( result.posted, true );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'dedup is skipped (no read) when dedupBaseUrl is unset, as in the other live-post tests', async () => {
	const file = writeResults( 120 );
	const { fetchImpl, calls } = dedupFetchStub( { evolutionHashes: [ 'testhash' ] } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		// No dedupBaseUrl → dedup is inert, so existing live-post tests keep making a
		// single POST call and never hit the evolution endpoint.
		const result = await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-no-dedup-config',
			} )
		);
		assert.equal( calls.evolution, 0 );
		assert.equal( result.posted, true );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'dedup queries the configured metric / repo / branch (endpoint identity)', async () => {
	// A wrong metric id, repo, or branch would silently query the wrong series and
	// never find a real duplicate. Pin the URL the read actually hits.
	const file = writeResults( 120 ); // git.branch = 'trunk'
	const { fetchImpl, calls } = dedupFetchStub( { evolutionHashes: [ 'someoneelse' ] } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		const u = calls.evolutionUrl;
		assert.ok( u, 'the evolution endpoint should have been queried' );
		assert.match(
			u,
			/^https:\/\/gitaudit\.test\/api\/repos\/Automattic\/jetpack\/perf\/evolution\/58\b/
		);
		assert.match( u, /[?&]branch=trunk\b/ );
		assert.match( u, /[?&]limit=200\b/ );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'dedup is bypassed for an unknown hash (still posts, no read)', async () => {
	// A results file with hash:'unknown' can't be deduped; it must skip the read and
	// still post (fail open), matching the pre-existing "post unknown" behaviour.
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-unknownhash-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'unknown', branch: 'trunk' },
			measurements: { jetpackConnected: { summary: jetpackSummary() } },
		} )
	);
	const { fetchImpl, calls } = dedupFetchStub( { evolutionHashes: [ 'unknown' ] } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		assert.equal( calls.evolution, 0, 'no read for an unknown hash' );
		assert.equal( result.posted, true );
	} finally {
		global.fetch = origFetch;
		fs.rmSync( dir, { recursive: true, force: true } );
	}
} );

test( 'dedup fails open on an unexpected (non-{data:[]}) read body', async () => {
	const file = writeResults( 120 );
	// 200 OK but the body isn't the expected { data: [...] } shape (e.g. an HTML/SPA
	// response or an API change). Must fail open and post, not throw.
	const { fetchImpl, calls } = dedupFetchStub( { evolutionBody: { unexpected: 'shape' } } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () => postToCodeVitals( file, DEDUP_CONFIG ) );
		assert.equal( result.posted, true );
		assert.equal( calls.post, 1 );
	} finally {
		global.fetch = origFetch;
	}
} );

test( 'a dry run makes no dedup read even when dedup is fully configured', async () => {
	// Pins the ordering: the dry-run early return must precede the dedup block, so the
	// token-free CI smoke test never touches the network even with dedupBaseUrl set.
	const file = writeResults( 120 );
	const { fetchImpl, calls } = dedupFetchStub( { evolutionHashes: [ 'testhash' ] } );
	const origFetch = global.fetch;
	global.fetch = fetchImpl;
	try {
		const result = await silenced( () =>
			postToCodeVitals( file, { ...DEDUP_CONFIG, dryRun: true } )
		);
		assert.equal( calls.evolution, 0, 'a dry run must not hit the dedup endpoint' );
		assert.equal( calls.post, 0 );
		assert.equal( result.posted, false );
	} finally {
		global.fetch = origFetch;
	}
} );
