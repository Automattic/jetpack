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
	exitCodeForError,
	extractScenarioMetrics,
	isDirectInvocation,
	postToCodeVitals,
	redactToken,
	resolvePostTimestamp,
	VALIDATION_FAILED_EXIT_CODE,
} from './post-to-codevitals.js';
import { shouldFailBuildOnPostError } from './run-performance-tests.js';
import { SANITY_RANGES, SCENARIOS } from './scenarios.js';

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

test( 'every posted exact-key scenario declares a metricType with a matching sanity range', () => {
	// Config contract for the real SCENARIOS: any scenario that posts an exact metricKey
	// must declare a metricType that has a SANITY_RANGES row, or it would post unchecked
	// (or throw at extraction). Pins this as a 2nd posted metric is added (FORMS-707).
	const posted = SCENARIOS.filter( s => s.postToCodeVitals && s.metricKey );
	assert.ok( posted.length > 0, 'expected at least one posted exact-key scenario' );
	for ( const scenario of posted ) {
		const label = scenario.key ?? scenario.metricKey;
		assert.ok( scenario.metricType, `scenario "${ label }" must declare a metricType` );
		assert.ok(
			SANITY_RANGES[ scenario.metricType ],
			`scenario "${ label }" type "${ scenario.metricType }" needs a SANITY_RANGES row`
		);
	}
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
				jetpackConnected: { summary: { median: 120 } }, // valid LCP → stays in payload
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
				jetpackConnected: { summary: { median: 120 } },
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

test( 'a validation failure is not downgraded to exit 1 when a later live POST also fails', async () => {
	// Reachable only with 2+ posted metrics (FORMS-707 territory): one metric fails the
	// sanity check (validationFailed=true) while a valid one remains and is POSTed. If
	// that POST then fails, the build must STILL exit with the data-integrity code — bad
	// local data is never suppressible by --allow-codevitals-failure.
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
				jetpackConnected: { summary: { median: 120 } }, // valid LCP → gets POSTed
				extraMetric: { summary: { median: 99999 } }, // outside [0,1000] → skipped, flags validationFailed
			},
		} )
	);
	const origFetch = global.fetch;
	// A transport failure AFTER a metric already failed local validation.
	global.fetch = async () => ( { ok: false, status: 500, text: async () => 'boom' } );
	let err;
	try {
		await silenced( () =>
			postToCodeVitals( file, {
				dryRun: false,
				codeVitalsUrl: 'https://codevitals.test',
				codeVitalsToken: 'tok-mixed',
			} )
		);
	} catch ( e ) {
		err = e;
	} finally {
		global.fetch = origFetch;
		SCENARIOS.pop();
		delete SANITY_RANGES.extratype;
		fs.rmSync( dir, { recursive: true, force: true } );
	}
	assert.ok( err, 'the live post should reject' );
	// Must map to the always-fatal data-integrity code, not a suppressible exit 1.
	assert.equal( exitCodeForError( err ), VALIDATION_FAILED_EXIT_CODE );
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

test( 'a dry-run payload is stamped with the commit time from the results file', async () => {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cv-ts-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync(
		file,
		JSON.stringify( {
			git: { hash: 'h', branch: 'trunk', timestamp: 1700000000000 },
			measurements: { jetpackConnected: { summary: { median: 120 } } },
		} )
	);
	try {
		const result = await silenced( () => postToCodeVitals( file, { dryRun: true } ) );
		assert.equal( result.payload.timestamp, 1700000000000 );
	} finally {
		fs.rmSync( dir, { recursive: true, force: true } );
	}
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
} ) {
	const calls = { evolution: 0, post: 0 };
	const fetchImpl = async u => {
		if ( String( u ).includes( '/perf/evolution/' ) ) {
			calls.evolution++;
			if ( throwOnEvolution ) {
				throw new Error( 'network down' );
			}
			return {
				ok: evolutionStatus >= 200 && evolutionStatus < 300,
				status: evolutionStatus,
				json: async () => ( {
					data: evolutionHashes.map( h => ( { hash: h, measuredAt: '2026-01-01' } ) ),
				} ),
				text: async () => '',
			};
		}
		calls.post++;
		return { ok: true, status: 200, json: async () => ( { ok: true } ), text: async () => '' };
	};
	return { fetchImpl, calls };
}

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
