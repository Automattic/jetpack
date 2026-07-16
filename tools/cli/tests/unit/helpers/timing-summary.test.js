import { jest } from '@jest/globals';
import { printTimingSummary, buildTimingJson } from '../../../helpers/timing-summary.js';

/**
 * Build a `ctx.timings`-shaped object from a list of phase entries.
 *
 * @param {Array}  entries     - Timing entries.
 * @param {object} [overrides] - Overrides for overallStart/buildOrder.
 * @return {object} A `ctx` with a `timings` property.
 */
function makeCtx( entries, overrides = {} ) {
	return {
		timings: {
			overallStart: 1000,
			buildOrder: [ 'packages/foo', 'plugins/bar' ],
			entries,
			...overrides,
		},
	};
}

// A representative run: a shared pnpm install, a fully-timed project, and a project that
// fails outside a timed phase (only the `_task` entry carries the failure).
const SAMPLE_ENTRIES = [
	{ project: 'pnpm install', phase: '_task', start: 1000, end: 6000, duration: 5000, ok: true },
	{ project: 'packages/foo', phase: 'install', start: 6000, end: 8000, duration: 2000, ok: true },
	{ project: 'packages/foo', phase: 'build', start: 8000, end: 11000, duration: 3000, ok: true },
	{ project: 'packages/foo', phase: '_task', start: 6000, end: 11500, duration: 5500, ok: true },
	{ project: 'plugins/bar', phase: 'install', start: 11000, end: 12000, duration: 1000, ok: true },
	{ project: 'plugins/bar', phase: '_task', start: 11000, end: 14000, duration: 3000, ok: false },
];

describe( 'buildTimingJson', () => {
	const argv = { concurrency: Infinity };

	test( 'splits project phases into install/build/other/total', () => {
		const json = buildTimingJson( makeCtx( SAMPLE_ENTRIES ), argv );
		expect( json.projects[ 'packages/foo' ] ).toEqual( {
			installMs: 2000,
			buildMs: 3000,
			otherMs: 500, // 5500 total - 2000 install - 3000 build
			totalMs: 5500,
			ok: true,
		} );
	} );

	test( 'reports a per-task failure even when it happens outside a timed phase', () => {
		const json = buildTimingJson( makeCtx( SAMPLE_ENTRIES ), argv );
		// bar only has a passing `install` entry; the failure lives on its `_task` total.
		expect( json.projects[ 'plugins/bar' ].ok ).toBe( false );
		expect( json.projects[ 'plugins/bar' ].buildMs ).toBeNull();
	} );

	test( 'puts shared tasks in the shared bucket, not projects', () => {
		const json = buildTimingJson( makeCtx( SAMPLE_ENTRIES ), argv );
		expect( json.shared ).toEqual( { 'pnpm install': { totalMs: 5000, ok: true } } );
		expect( json.projects[ 'pnpm install' ] ).toBeUndefined();
	} );

	test( 'sums every per-project total and reports wall-clock from overallStart', () => {
		const json = buildTimingJson( makeCtx( SAMPLE_ENTRIES ), argv );
		expect( json.sumOfProjectTotalsMs ).toBe( 13500 ); // 5000 + 5500 + 3000
		expect( json.wallClockMs ).toBeGreaterThan( 0 );
		expect( json.version ).toBe( 1 );
		expect( json.command ).toBe( 'build' );
	} );

	test( 'serializes infinite concurrency as "unlimited" and finite as a number', () => {
		expect(
			buildTimingJson( makeCtx( SAMPLE_ENTRIES ), { concurrency: Infinity } ).concurrency
		).toBe( 'unlimited' );
		expect( buildTimingJson( makeCtx( SAMPLE_ENTRIES ), { concurrency: 4 } ).concurrency ).toBe(
			4
		);
	} );

	test( 'passes the raw entries through untouched', () => {
		const json = buildTimingJson( makeCtx( SAMPLE_ENTRIES ), argv );
		expect( json.raw ).toBe( SAMPLE_ENTRIES );
	} );
} );

describe( 'printTimingSummary', () => {
	let logSpy;

	beforeEach( () => {
		logSpy = jest.spyOn( console, 'log' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		logSpy.mockRestore();
	} );

	/**
	 * Run printTimingSummary and return everything it logged as one string.
	 *
	 * @param {object} ctx  - Build context.
	 * @param {object} argv - CLI args.
	 * @return {string} Joined console.log output.
	 */
	function capture( ctx, argv ) {
		printTimingSummary( ctx, argv );
		return logSpy.mock.calls.map( c => c[ 0 ] ).join( '\n' );
	}

	test( 'does nothing when there are no entries', () => {
		capture( makeCtx( [] ), { concurrency: Infinity } );
		expect( logSpy ).not.toHaveBeenCalled();
	} );

	test( 'prints a header, a row per task, and the footer totals', () => {
		const out = capture( makeCtx( SAMPLE_ENTRIES ), { concurrency: Infinity } );
		expect( out ).toContain( 'Timing summary (concurrency: unlimited)' );
		expect( out ).toMatch( /Project\s+Install\s+Build\s+Other\s+Total/ );
		expect( out ).toContain( 'pnpm install' );
		expect( out ).toContain( 'packages/foo' );
		expect( out ).toContain( 'plugins/bar' );
		expect( out ).toContain( 'Sum of per-project totals' );
		expect( out ).toContain( 'Wall-clock (overall)' );
	} );

	test( 'shows shared install time under Install (em dash for Build/Other)', () => {
		const out = capture( makeCtx( SAMPLE_ENTRIES ), { concurrency: Infinity } );
		const sharedRow = out.split( '\n' ).find( l => l.includes( 'pnpm install' ) );
		// Install populated, Build + Other are em dashes for a shared task.
		expect( sharedRow ).toContain( '5.000s' );
		expect( sharedRow.match( /—/g ) ).toHaveLength( 2 );
	} );

	test( 'lists shared rows before build rows, in build order', () => {
		const out = capture( makeCtx( SAMPLE_ENTRIES ), { concurrency: Infinity } );
		const idx = name => out.indexOf( name );
		expect( idx( 'pnpm install' ) ).toBeLessThan( idx( 'packages/foo' ) );
		expect( idx( 'packages/foo' ) ).toBeLessThan( idx( 'plugins/bar' ) );
	} );

	test( 'renders a finite concurrency value in the header', () => {
		const out = capture( makeCtx( SAMPLE_ENTRIES ), { concurrency: 2 } );
		expect( out ).toContain( 'Timing summary (concurrency: 2)' );
	} );
} );
