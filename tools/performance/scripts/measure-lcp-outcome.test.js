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
import { test } from 'node:test';
import { computeRunOutcome, resolveScenarioSet } from './measure-lcp.js';
import { tcEscape } from './run-performance-tests.js';
import { SCENARIOS } from './scenarios.js';

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
