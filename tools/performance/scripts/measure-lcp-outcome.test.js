/**
 * Unit tests for the per-scenario failure-isolation policy (FORMS-728).
 *
 * The posting policy lives once, in measure-lcp's exit semantics: exit 0 means "every
 * required scenario measured — safe to post". These tests pin that policy's two helpers
 * (resolveScenarioSet, computeRunOutcome) and the TeamCity service-message escaping that
 * surfaces a green-but-partial build. Run with `pnpm test:unit` (node's built-in runner —
 * no Docker, no token, no network).
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import {
	buildSummary,
	captureNavigationMetrics,
	initializeLoadObservers,
	computeRunOutcome,
	finalizeMeasurement,
	findIncompleteSummaryFields,
	resolveScenarioSet,
} from './measure-lcp.js';
import { tcEscape, reportSkippedScenarios } from './run-performance-tests.js';
import { SCENARIOS } from './scenarios.js';

const SCRIPTS_DIR = path.dirname( fileURLToPath( import.meta.url ) );

/**
 * Run a function while capturing console.log/console.warn lines, restoring after.
 *
 * @param {Function} fn - Function to run under capture.
 * @return {{log: string[], warn: string[]}} Captured lines per channel.
 */
function captureConsole( fn ) {
	const lines = { log: [], warn: [] };
	const orig = { log: console.log, warn: console.warn };
	console.log = ( ...args ) => lines.log.push( args.join( ' ' ) );
	console.warn = ( ...args ) => lines.warn.push( args.join( ' ' ) );
	try {
		fn();
	} finally {
		Object.assign( console, orig );
	}
	return lines;
}

/**
 * Write a results-file fixture with the given measurements and return its path.
 *
 * @param {object} measurements - The measurements object to persist.
 * @return {string} Path to the written JSON file.
 */
function writeResultsFixture( measurements ) {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'outcome-results-' ) );
	const file = path.join( dir, 'results.json' );
	fs.writeFileSync( file, JSON.stringify( { measurements } ) );
	return file;
}

// A minimal scenario double: one required, two optional (mirrors the live set's shape).
const REQUIRED = { key: 'req', name: 'Required scenario', cliName: 'req', optional: false };
const OPT_A = { key: 'optA', name: 'Optional A', cliName: 'opt-a', optional: true };
const OPT_B = { key: 'optB', name: 'Optional B', cliName: 'opt-b', optional: true };
const DOUBLES = [ REQUIRED, OPT_A, OPT_B ];

const ok = { summary: { median: 100 } };
const failed = { error: 'boom' };

// --- resolveScenarioSet (SCENARIO filter validation) ---

test( "resolveScenarioSet returns every scenario for 'all'", () => {
	assert.deepEqual( resolveScenarioSet( 'all', DOUBLES ), DOUBLES );
	assert.deepEqual( resolveScenarioSet( 'all', SCENARIOS ), SCENARIOS );
} );

test( 'resolveScenarioSet matches exactly one scenario by cliName', () => {
	assert.deepEqual( resolveScenarioSet( 'opt-a', DOUBLES ), [ OPT_A ] );
	const forms = resolveScenarioSet( 'forms-responses', SCENARIOS );
	assert.equal( forms.length, 1 );
	assert.equal( forms[ 0 ].key, 'formsResponses' );
	// The ticket's literal case: the CORRECT spelling `my-jetpack` selects exactly the
	// myJetpack scenario from the real SCENARIOS (the typo half is tested below).
	const myJetpack = resolveScenarioSet( 'my-jetpack', SCENARIOS );
	assert.equal( myJetpack.length, 1 );
	assert.equal( myJetpack[ 0 ].key, 'myJetpack' );
} );

test( 'resolveScenarioSet throws on an unknown filter, listing the valid values', () => {
	// The ticket's motivating typo: before this guard, `SCENARIO=my-jetpak` matched nothing,
	// wrote an empty measurements object, and exited 0 — a green build that measured nothing.
	assert.throws(
		() => resolveScenarioSet( 'my-jetpak', SCENARIOS ),
		/Unknown SCENARIO "my-jetpak"\. Valid values: all, jetpack-connected, forms-responses, my-jetpack/
	);
} );

test( 'resolveScenarioSet is case-sensitive (cliNames are lowercase)', () => {
	assert.throws( () => resolveScenarioSet( 'Forms-Responses', SCENARIOS ), /Unknown SCENARIO/ );
} );

// --- computeRunOutcome (the exit-code policy) ---

test( 'all scenarios measured: exit 0, no failures', () => {
	const outcome = computeRunOutcome( { req: ok, optA: ok, optB: ok }, DOUBLES );
	assert.deepEqual( outcome, { exitCode: 0, requiredFailures: [], optionalFailures: [] } );
} );

test( 'optional-only failures with the required scenario OK: exit 0, names reported', () => {
	// The FORMS-728 case itself: a broken optional scenario must not blank the required
	// scenario's posting. Green build, loud warning, keys skip the build.
	const outcome = computeRunOutcome( { req: ok, optA: failed, optB: ok }, DOUBLES );
	assert.equal( outcome.exitCode, 0 );
	assert.deepEqual( outcome.requiredFailures, [] );
	assert.deepEqual( outcome.optionalFailures, [ 'Optional A' ] );
} );

test( 'any required failure: exit 1 even when the optional scenarios measured fine', () => {
	// Retry-safety invariant: a red build posts nothing, so re-running it cannot append
	// duplicate points. The measured optional survivors are deliberately discarded.
	const outcome = computeRunOutcome( { req: failed, optA: ok, optB: ok }, DOUBLES );
	assert.equal( outcome.exitCode, 1 );
	assert.deepEqual( outcome.requiredFailures, [ 'Required scenario' ] );
	assert.deepEqual( outcome.optionalFailures, [] );
} );

test( 'ALL scenarios failed: exit 1 even when every one of them is optional', () => {
	// Keeps a targeted single-scenario run honest: SCENARIO=<optional> with that scenario
	// failing must fail loudly, not green-exit having measured nothing.
	const outcome = computeRunOutcome( { optA: failed }, DOUBLES );
	assert.equal( outcome.exitCode, 1 );
	assert.deepEqual( outcome.optionalFailures, [ 'Optional A' ] );

	const allFailed = computeRunOutcome( { optA: failed, optB: failed }, DOUBLES );
	assert.equal( allFailed.exitCode, 1 );
} );

test( 'a single measured optional scenario: exit 0 (the all-failed rule needs a failure)', () => {
	const outcome = computeRunOutcome( { optA: ok }, DOUBLES );
	assert.deepEqual( outcome, { exitCode: 0, requiredFailures: [], optionalFailures: [] } );
} );

test( 'empty measurements: exit 1 (backstop behind the validated filter)', () => {
	assert.equal( computeRunOutcome( {}, DOUBLES ).exitCode, 1 );
	assert.equal( computeRunOutcome( {}, SCENARIOS ).exitCode, 1 );
} );

// --- findIncompleteSummaryFields (the partial-summary → measurement-failure boundary) ---

test( 'findIncompleteSummaryFields returns [] for a complete summary', () => {
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const summary = {
		wpTotal: { median: 100 },
		wpMemoryUsage: { median: 20971520 },
		wpDbQueries: { median: 42 },
		median: 300,
		lcp: { median: 300 },
		ttfb: { median: 200 },
		fcp: { median: 500 },
		decodedBytesKB: { median: 8229 },
		tbt: { median: 0 },
	};
	assert.deepEqual( findIncompleteSummaryFields( forms, summary ), [] );
} );

test( 'findIncompleteSummaryFields names a posted field whose block the summary dropped', () => {
	// The partial-summary case: the scenario neither threw nor came back summary-less, but
	// one posted field (here ttfb) missed the majority rule and buildSummary omitted its
	// block. Undetected, this sails past every `.error` check, greens the measure step, and
	// then trips the poster's ATOMIC sanity gate on the undefined median — one flaky
	// optional field blanking the required Dashboard's post with no warning naming it.
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const summary = {
		wpTotal: { median: 100 },
		wpMemoryUsage: { median: 20971520 },
		wpDbQueries: { median: 42 },
		median: 300,
		lcp: { median: 300 },
		fcp: { median: 500 },
		decodedBytesKB: { median: 8229 },
		tbt: { median: 0 },
	};
	assert.deepEqual( findIncompleteSummaryFields( forms, summary ), [ 'ttfb' ] );
	// A block that exists but has no finite median is just as unusable as a missing block.
	assert.deepEqual( findIncompleteSummaryFields( forms, { ...summary, ttfb: { median: null } } ), [
		'ttfb',
	] );
} );

test( 'findIncompleteSummaryFields checks the flat LCP mirror for scenarios without metrics[]', () => {
	// Legacy metricKey/metricPrefix scenarios post from summary.median (the flat LCP
	// mirror), which buildSummary emits exactly when the lcp block exists — so checking
	// the lcp block covers them.
	const legacy = { key: 'legacy', name: 'Legacy', metricKey: 'legacy-lcp', metricType: 'lcp' };
	assert.deepEqual( findIncompleteSummaryFields( legacy, { lcp: { median: 120 } } ), [] );
	assert.deepEqual( findIncompleteSummaryFields( legacy, { median: undefined } ), [ 'lcp' ] );
} );

test( 'a majority-rule field drop in buildSummary is caught as incomplete', () => {
	// End-to-end through the real aggregation: 3 valid iterations where ttfb was finite in
	// only 1 (no strict majority) — buildSummary drops the ttfb block, and the completeness
	// check must flag it so the measure step records a scenario error, not a green partial.
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const iterations = [
		{
			lcp: 300,
			metrics: {
				wpTotal: 100,
				wpMemoryUsage: 20971520,
				wpDbQueries: 42,
				ttfb: 200,
				fcp: 500,
				decodedBytesKB: 8229,
				tbt: 0,
			},
		},
		{
			lcp: 310,
			metrics: {
				wpTotal: 100,
				wpMemoryUsage: 20971520,
				wpDbQueries: 42,
				ttfb: null,
				fcp: 510,
				decodedBytesKB: 8229,
				tbt: 0,
			},
		},
		{
			lcp: 305,
			metrics: {
				wpTotal: 100,
				wpMemoryUsage: 20971520,
				wpDbQueries: 42,
				ttfb: null,
				fcp: 505,
				decodedBytesKB: 8229,
				tbt: 0,
			},
		},
	];
	const summary = buildSummary( iterations, 3 );
	assert.equal( summary.ttfb, undefined, 'precondition: the majority rule dropped ttfb' );
	assert.deepEqual( findIncompleteSummaryFields( forms, summary ), [ 'ttfb' ] );

	// The healthy control: every field finite in a majority — nothing flagged.
	const healthy = buildSummary(
		iterations.map( it => ( { ...it, metrics: { ...it.metrics, ttfb: 200 } } ) ),
		3
	);
	assert.deepEqual( findIncompleteSummaryFields( forms, healthy ), [] );
} );

test( "buildSummary mirrors the lcp block flat on the summary root (the ['lcp'] fallback invariant)", () => {
	// findIncompleteSummaryFields checks legacy metricKey/metricPrefix scenarios via the
	// lcp block, which is only sound while buildSummary keeps mirroring that block's stats
	// (median first among them) onto the summary root. Pin the invariant so a buildSummary
	// refactor that drops the mirror fails here instead of silently un-covering the legacy
	// posting shapes.
	const summary = buildSummary(
		[
			{
				lcp: 300,
				metrics: {
					wpTotal: 100,
					wpMemoryUsage: 20971520,
					wpDbQueries: 42,
					ttfb: 200,
					fcp: 500,
					decodedBytesKB: 8229,
					tbt: 0,
				},
			},
			{
				lcp: 310,
				metrics: {
					wpTotal: 100,
					wpMemoryUsage: 20971520,
					wpDbQueries: 42,
					ttfb: 210,
					fcp: 510,
					decodedBytesKB: 8229,
					tbt: 0,
				},
			},
		],
		2
	);
	assert.equal( summary.median, summary.lcp.median );
	assert.equal( summary.mean, summary.lcp.mean );
} );

// --- finalizeMeasurement (the measure step's refusal paths, without a browser) ---

// Per-iteration fixtures shaped like measureLCP's results array: lcp flat, the other
// posted fields on `metrics`.
const healthyIteration = i => ( {
	iteration: i,
	lcp: 300 + i,
	metrics: {
		wpTotal: 100,
		wpMemoryUsage: 20971520,
		wpDbQueries: 42,
		ttfb: 200,
		fcp: 500,
		decodedBytesKB: 8229,
		tbt: 0,
	},
} );

test( 'finalizeMeasurement returns the measurement for healthy iterations', () => {
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const results = [ 1, 2, 3 ].map( healthyIteration );
	const measurement = finalizeMeasurement( forms, results, 3, 'http://example.test' );
	assert.equal( measurement.url, 'http://example.test' );
	assert.equal( measurement.results, results );
	assert.equal( measurement.summary.lcp.median, 302 );
	assert.deepEqual( findIncompleteSummaryFields( forms, measurement.summary ), [] );
} );

test( 'finalizeMeasurement throws when every iteration failed', () => {
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	assert.throws(
		() => finalizeMeasurement( forms, [ { iteration: 1, error: 'boom' } ], 1, 'u' ),
		/All iterations failed/
	);
} );

const backendHeader = 'wp-total;dur=100.5, wp-memory-usage;dur=20971520, wp-db-queries;dur=42';
const navigationResponse = header => ( {
	headerValue: async name => {
		assert.equal( name, 'server-timing' );
		return header;
	},
	url: () => 'http://fixture/wp-admin/',
	status: () => 200,
} );

test( 'navigation capture merges parsed backend values into browser metrics', async () => {
	const scenario = SCENARIOS.find( s => s.key === 'jetpackConnected' );
	const browser = { lcp: 300, ttfb: 200, fcp: 500, decodedBytesKB: 8229 };
	const capture = await captureNavigationMetrics(
		navigationResponse( backendHeader ),
		scenario,
		browser
	);
	assert.deepEqual( capture.metrics, {
		...browser,
		wpTotal: 100.5,
		wpMemoryUsage: 20971520,
		wpDbQueries: 42,
	} );
	assert.equal( capture.serverTimingHeader, backendHeader );
	assert.equal( capture.navigationStatus, 200 );
	assert.equal( capture.navigationUrl, 'http://fixture/wp-admin/' );
	assert.equal( capture.serverTimingError, undefined );
	assert.deepEqual( browser, { lcp: 300, ttfb: 200, fcp: 500, decodedBytesKB: 8229 } );
} );

test( 'browser-only scenarios do not require a backend header', async () => {
	const response = navigationResponse( null );
	response.headerValue = () => assert.fail( 'backend header should not be read' );
	const capture = await captureNavigationMetrics(
		response,
		{ metrics: [ { field: 'lcp' } ] },
		{ lcp: 300 }
	);
	assert.deepEqual( capture.metrics, { lcp: 300 } );
	assert.equal( capture.serverTimingError, undefined );
} );

test( 'backend capture failures preserve browser samples and use the per-field majority', async () => {
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	for ( const failedCaptures of [ 2, 3 ] ) {
		const results = await Promise.all(
			[ 1, 2, 3, 4, 5 ].map( async i => {
				let header = backendHeader;
				if ( i <= failedCaptures ) {
					header = i === 1 ? null : 'wp-total;dur=bad';
				}
				return {
					iteration: i,
					lcp: 300 + i,
					...( await captureNavigationMetrics( navigationResponse( header ), forms, {
						lcp: 300 + i,
						ttfb: 200,
						fcp: 500,
						decodedBytesKB: 8229,
						tbt: 0,
					} ) ),
				};
			} )
		);
		for ( const result of results.slice( 0, failedCaptures ) ) {
			assert.match( result.serverTimingError, /Missing|Invalid/ );
			assert.equal( result.navigationStatus, 200 );
			assert.equal( result.error, undefined );
			for ( const field of [ 'wpTotal', 'wpMemoryUsage', 'wpDbQueries' ] ) {
				assert.equal( result.metrics[ field ], undefined );
			}
		}
		const summary = buildSummary( results, 5 );
		assert.equal( summary.successfulIterations, 5 );
		assert.equal( summary.lcp.median, 303 );
		assert.equal( summary.ttfb.median, 200 );
		assert.equal( summary.fcp.median, 500 );
		assert.equal( summary.decodedBytesKB.median, 8229 );
		if ( failedCaptures === 2 ) {
			assert.equal( finalizeMeasurement( forms, results, 5, 'url' ).summary.wpTotal.median, 101 );
		} else {
			assert.throws(
				() => finalizeMeasurement( forms, results, 5, 'url' ),
				/missing posted field\(s\): wpTotal, wpMemoryUsage, wpDbQueries/
			);
		}
	}
} );

test( 'finalizeMeasurement throws on a partial summary, naming the dropped field', () => {
	// The CASE P wiring, pinned through the real measure tail: a posted field finite in
	// only a minority of valid iterations must throw INSIDE the measure step (so main()'s
	// catch records a scenario error the optional/required policy classifies), never
	// return a truthy-but-incomplete measurement for the artifact.
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const results = [ 1, 2, 3 ].map( healthyIteration );
	results[ 1 ].metrics = { ...results[ 1 ].metrics, ttfb: null };
	results[ 2 ].metrics = { ...results[ 2 ].metrics, ttfb: null };
	assert.throws(
		() => finalizeMeasurement( forms, results, 3, 'u' ),
		/summary is missing posted field\(s\): ttfb — too few finite samples across the 3 valid iteration\(s\)/
	);
} );

test( 'finalizeMeasurement counts valid iterations, not attempted ones, in the partial message', () => {
	// 5 attempted, 2 errored, 3 valid — the message must say 3: the majority rule runs
	// over the VALID iterations, and a misleading count sends the operator to the wrong
	// denominator when reading the build log.
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const results = [
		...[ 1, 2, 3 ].map( healthyIteration ),
		{ iteration: 4, error: 'boom' },
		{ iteration: 5, error: 'boom' },
	];
	results[ 1 ].metrics = { ...results[ 1 ].metrics, ttfb: null };
	results[ 2 ].metrics = { ...results[ 2 ].metrics, ttfb: null };
	assert.throws( () => finalizeMeasurement( forms, results, 5, 'u' ), /the 3 valid iteration/ );
} );

// --- tcEscape (TeamCity service-message value escaping) ---

test( 'tcEscape escapes every character TeamCity requires', () => {
	assert.equal( tcEscape( 'a|b' ), 'a||b' );
	assert.equal( tcEscape( "it's" ), "it|'s" );
	assert.equal( tcEscape( '[tag]' ), '|[tag|]' );
	assert.equal( tcEscape( 'line1\nline2\rline3' ), 'line1|nline2|rline3' );
	// The Unicode line terminators the spec also requires: NEL, LS, PS.
	assert.equal( tcEscape( 'a\u0085b\u2028c\u2029d' ), 'a|xb|lc|pd' );
	assert.equal( tcEscape( 'plain text stays' ), 'plain text stays' );
} );

test( 'tcEscape escapes the pipe first, never double-escaping the others', () => {
	// If | were escaped after the others, "|'" would become "||'" and corrupt the message.
	assert.equal( tcEscape( "|'|[|]" ), "|||'|||[|||]" );
} );

// --- CLI wiring: the main() SCENARIO-validation exit path ---

test( 'CLI: an unknown SCENARIO exits 1 with the valid values, before any browser work', () => {
	// The ticket's motivating incident lived in this exact wiring: the pure helper throwing
	// is not enough if main() stops calling it (or falls through after catching). Validation
	// runs before Docker/browser setup, so this returns quickly on a plain node spawn.
	const result = spawnSync( process.execPath, [ path.join( SCRIPTS_DIR, 'measure-lcp.js' ) ], {
		env: { ...process.env, SCENARIO: 'my-jetpak' },
		encoding: 'utf8',
		timeout: 30000,
	} );
	assert.equal( result.status, 1 );
	assert.match( result.stderr, /Unknown SCENARIO "my-jetpak"/ );
	assert.match( result.stderr, /jetpack-connected, forms-responses, my-jetpack/ );
} );

// --- reportSkippedScenarios (the green-partial visibility channel) ---

test( 'reportSkippedScenarios emits the exact TeamCity WARNING plus a console warning', () => {
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const file = writeResultsFixture( {
		jetpackConnected: { summary: { median: 100 } },
		formsResponses: { error: 'boom' },
		myJetpack: { summary: { median: 200 } },
	} );
	const lines = captureConsole( () => reportSkippedScenarios( file ) );
	const expectedText = `${ forms.name } measurement failed; its CodeVitals keys skip this build`;
	assert.deepEqual( lines.log, [
		`##teamcity[message text='${ tcEscape( expectedText ) }' status='WARNING']`,
	] );
	assert.equal( lines.warn.length, 1 );
	assert.ok( lines.warn[ 0 ].includes( expectedText ) );
} );

test( 'reportSkippedScenarios names every failed optional scenario in one message', () => {
	const forms = SCENARIOS.find( s => s.key === 'formsResponses' );
	const myJetpack = SCENARIOS.find( s => s.key === 'myJetpack' );
	const file = writeResultsFixture( {
		jetpackConnected: { summary: { median: 100 } },
		formsResponses: { error: 'boom' },
		myJetpack: { error: 'also boom' },
	} );
	const lines = captureConsole( () => reportSkippedScenarios( file ) );
	const expectedText = `${ forms.name }, ${ myJetpack.name } measurements failed; their CodeVitals keys skip this build`;
	assert.deepEqual( lines.log, [
		`##teamcity[message text='${ tcEscape( expectedText ) }' status='WARNING']`,
	] );
	assert.equal( lines.warn.length, 1 );
	assert.ok( lines.warn[ 0 ].includes( expectedText ) );
} );

test( 'reportSkippedScenarios stays silent when nothing failed', () => {
	const file = writeResultsFixture( {
		jetpackConnected: { summary: { median: 100 } },
		formsResponses: { summary: { median: 300 } },
		myJetpack: { summary: { median: 200 } },
	} );
	const lines = captureConsole( () => reportSkippedScenarios( file ) );
	assert.deepEqual( lines.log, [] );
	assert.deepEqual( lines.warn, [] );
} );

test( 'reportSkippedScenarios warns readably (no TeamCity message) on a missing/unreadable file', () => {
	const missing = captureConsole( () =>
		reportSkippedScenarios( path.join( os.tmpdir(), 'outcome-results-nope', 'missing.json' ) )
	);
	assert.deepEqual( missing.log, [] );
	assert.equal( missing.warn.length, 1 );
	assert.match( missing.warn[ 0 ], /Could not read results/ );

	const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'outcome-results-bad-' ) );
	const badFile = path.join( dir, 'results.json' );
	fs.writeFileSync( badFile, '{ not json' );
	const malformed = captureConsole( () => reportSkippedScenarios( badFile ) );
	assert.deepEqual( malformed.log, [] );
	assert.match( malformed.warn[ 0 ], /Could not read results/ );
} );

/** Execute the browser initializer with a controllable observer implementation. */
function longTaskHarness( {
	supported = true,
	observeError = false,
	drainError = false,
	disconnectError = false,
	synchronousEntries,
} = {} ) {
	const descriptors = Object.fromEntries(
		[ 'window', 'performance', 'PerformanceObserver' ].map( key => [
			key,
			Object.getOwnPropertyDescriptor( globalThis, key ),
		] )
	);
	const browserWindow = {};
	let longTaskObserver;
	class Observer {
		static supportedEntryTypes = supported ? [ 'longtask' ] : [];
		constructor( callback ) {
			this.callback = callback;
			this.pending = [];
		}
		observe( options ) {
			if ( options.type === 'longtask' ) {
				assert.equal( options.buffered, true );
				longTaskObserver = this;
				if ( observeError ) {
					throw new Error( 'capture failed' );
				}
				if ( synchronousEntries ) {
					this.callback( { getEntries: () => synchronousEntries } );
				}
			}
		}
		takeRecords() {
			if ( drainError ) {
				throw new Error( 'drain failed' );
			}
			return this.pending.splice( 0 );
		}
		disconnect() {
			this.disconnected = true;
			if ( disconnectError ) {
				throw new Error( 'disconnect failed' );
			}
		}
	}
	try {
		Object.defineProperties( globalThis, {
			window: { value: browserWindow, configurable: true },
			performance: { value: { setResourceTimingBufferSize() {} }, configurable: true },
			PerformanceObserver: { value: Observer, configurable: true },
		} );
		initializeLoadObservers();
	} finally {
		for ( const [ key, descriptor ] of Object.entries( descriptors ) ) {
			if ( descriptor ) {
				Object.defineProperty( globalThis, key, descriptor );
			} else {
				delete globalThis[ key ];
			}
		}
	}
	return { finalize: browserWindow.__finalizeLongTasks, observer: longTaskObserver };
}

test( 'load TBT includes pre-paint tasks, drains pending records and excludes tasks beyond cutoff', () => {
	const { finalize, observer } = longTaskHarness();
	const early = { startTime: 0, duration: 120 };
	observer.callback( { getEntries: () => [ early, { startTime: 130, duration: 40 } ] } );
	observer.pending = [
		{ startTime: 200, duration: 80 },
		{ startTime: 200, duration: 100 },
		{ startTime: 250, duration: 50 },
		{ startTime: 280, duration: 60 },
		{ startTime: 400, duration: 100 },
	];
	assert.deepEqual( finalize( 300 ), {
		tbt: 150,
		longTasks: [
			early,
			{ startTime: 130, duration: 40 },
			{ startTime: 200, duration: 80 },
			{ startTime: 200, duration: 100 },
			{ startTime: 250, duration: 50 },
		],
	} );
	assert.deepEqual( observer.pending, [] );
	assert.equal( observer.disconnected, true );
} );

test( 'serialized load observers capture long tasks without module globals', () => {
	const browserWindow = {};
	class Observer {
		static supportedEntryTypes = [ 'longtask' ];
		observe() {}
		takeRecords() {
			return [
				{ startTime: 0, duration: 120 },
				{ startTime: 200, duration: 80 },
				{ startTime: 280, duration: 60 },
			];
		}
		disconnect() {}
	}
	runInNewContext( '(' + initializeLoadObservers.toString() + ')()', {
		window: browserWindow,
		performance: { setResourceTimingBufferSize() {} },
		PerformanceObserver: Observer,
	} );
	const capture = browserWindow.__finalizeLongTasks( 300 );
	assert.equal( capture.tbt, 100 );
	assert.equal( capture.longTasks.length, 2 );
} );

test( 'working empty capture is zero; unsupported or failed capture is missing', () => {
	assert.deepEqual( longTaskHarness().finalize( 300 ), { tbt: 0, longTasks: [] } );
	for ( const [ options, longTaskError ] of [
		[ { supported: false }, 'unsupported' ],
		[ { observeError: true }, 'observe-threw' ],
		[ { drainError: true }, 'finalizer-threw' ],
	] ) {
		assert.deepEqual( longTaskHarness( options ).finalize( 300 ), {
			tbt: null,
			longTasks: null,
			longTaskError,
		} );
	}
} );

test( 'a throwing long-task callback remains missing after a later successful callback', () => {
	const { finalize, observer } = longTaskHarness();
	observer.callback( {
		getEntries() {
			throw new Error( 'callback failed' );
		},
	} );
	observer.callback( { getEntries: () => [ { startTime: 0, duration: 120 } ] } );
	assert.deepEqual( finalize( 300 ), {
		tbt: null,
		longTasks: null,
		longTaskError: 'callback-threw',
	} );
	assert.equal( observer.disconnected, true );
} );

test( 'non-finite or negative long-task timings are missing data', () => {
	for ( const entry of [
		{ startTime: NaN, duration: 120 },
		{ startTime: 0, duration: NaN },
		{ startTime: -1, duration: 120 },
		{ startTime: 0, duration: -1 },
	] ) {
		const { finalize, observer } = longTaskHarness();
		observer.pending = [ entry ];
		assert.deepEqual( finalize( 300 ), {
			tbt: null,
			longTasks: null,
			longTaskError: 'invalid-entry',
		} );
	}
} );

test( 'a non-finite load-finalization cutoff is missing data', () => {
	for ( const cutoff of [ undefined, NaN, Infinity ] ) {
		const { finalize, observer } = longTaskHarness();
		observer.pending = [ { startTime: 0, duration: 120 } ];
		assert.deepEqual( finalize( cutoff ), {
			tbt: null,
			longTasks: null,
			longTaskError: 'invalid-cutoff',
		} );
		assert.equal( observer.disconnected, true );
	}
} );

test( 'long-task entries delivered synchronously during observe are preserved', () => {
	const early = { startTime: 0, duration: 120 };
	const { finalize } = longTaskHarness( { synchronousEntries: [ early ] } );
	assert.deepEqual( finalize( 300 ), { tbt: 70, longTasks: [ early ] } );
} );

test( 'a disconnect failure does not discard the long-task capture', () => {
	const { finalize, observer } = longTaskHarness( { disconnectError: true } );
	const early = { startTime: 0, duration: 120 };
	observer.pending = [ early ];
	assert.deepEqual( finalize( 300 ), { tbt: 70, longTasks: [ early ] } );
	assert.equal( observer.disconnected, true );
} );

test( 'TBT preserves zero in summary and requires a majority for optional-page posting', () => {
	const forms = SCENARIOS.find( scenario => scenario.key === 'formsResponses' );
	const results = [ 1, 2, 3 ].map( healthyIteration );
	assert.equal( finalizeMeasurement( forms, results, 3, 'u' ).summary.tbt.median, 0 );
	results[ 1 ].metrics.tbt = null;
	results[ 2 ].metrics.tbt = null;
	assert.equal( buildSummary( results, 3 ).tbt, undefined );
	assert.throws(
		() => finalizeMeasurement( forms, results, 3, 'u' ),
		/missing posted field\(s\): tbt/
	);
	const dashboard = SCENARIOS.find( scenario => scenario.key === 'jetpackConnected' );
	assert.doesNotThrow( () => finalizeMeasurement( dashboard, results, 3, 'u' ) );
} );
