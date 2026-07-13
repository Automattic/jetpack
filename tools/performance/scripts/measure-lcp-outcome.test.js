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
import { computeRunOutcome, resolveScenarioSet } from './measure-lcp.js';
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

// --- tcEscape (TeamCity service-message value escaping) ---

test( 'tcEscape escapes every character TeamCity requires', () => {
	assert.equal( tcEscape( 'a|b' ), 'a||b' );
	assert.equal( tcEscape( "it's" ), "it|'s" );
	assert.equal( tcEscape( '[tag]' ), '|[tag|]' );
	assert.equal( tcEscape( 'line1\nline2\rline3' ), 'line1|nline2|rline3' );
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
	assert.equal( lines.log.length, 1 );
	assert.ok( lines.log[ 0 ].includes( `${ forms.name }, ${ myJetpack.name }` ) );
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
