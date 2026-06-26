/**
 * Unit tests for the CodeVitals sanity guard.
 *
 * CodeVitals is append-only with no rollback, so these tests pin the one
 * contract that keeps bad data out: checkSanityRange must fail closed on
 * anything it cannot positively confirm is in range. Run with `pnpm test:unit`
 * (node's built-in runner — no Docker, no token, no network).
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkSanityRange, extractScenarioMetrics } from './post-to-codevitals.js';

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

test( 'a genuinely untyped legacy entry passes unchecked', () => {
	assert.equal( checkSanityRange( undefined, 999999 ).ok, true );
} );

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
