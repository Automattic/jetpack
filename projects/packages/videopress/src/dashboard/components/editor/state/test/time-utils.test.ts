import {
	clampToTrim,
	formatTimecode,
	getPxPerMs,
	msToPx,
	pickRulerStep,
	pxToMs,
	snapMs,
	DEFAULT_SNAP_THRESHOLD_PX,
	MIN_TICK_SPACING_PX,
	RULER_STEPS_MS,
} from '../time-utils';

describe( 'getPxPerMs', () => {
	it( 'derives the scale from viewport, zoom, and duration', () => {
		expect( getPxPerMs( 1000, 1, 10000 ) ).toBe( 0.1 );
		expect( getPxPerMs( 1000, 4, 10000 ) ).toBe( 0.4 );
		expect( getPxPerMs( 500, 2, 10000 ) ).toBe( 0.1 );
	} );

	it( 'returns 0 for a degenerate duration', () => {
		expect( getPxPerMs( 1000, 1, 0 ) ).toBe( 0 );
		expect( getPxPerMs( 1000, 1, -100 ) ).toBe( 0 );
	} );
} );

describe( 'msToPx / pxToMs', () => {
	it( 'converts time to pixels', () => {
		expect( msToPx( 5000, 0.1 ) ).toBe( 500 );
		expect( msToPx( 0, 0.1 ) ).toBe( 0 );
	} );

	it( 'converts pixels to integer milliseconds', () => {
		expect( pxToMs( 500, 0.1 ) ).toBe( 5000 );
		expect( pxToMs( 100, 0.3 ) ).toBe( 333 );
	} );

	it( 'guards a degenerate scale', () => {
		expect( pxToMs( 500, 0 ) ).toBe( 0 );
		expect( pxToMs( 500, -1 ) ).toBe( 0 );
	} );

	it( 'round-trips within rounding error', () => {
		const pxPerMs = getPxPerMs( 1234, 2.5, 987654 );
		for ( const ms of [ 0, 1, 12345, 987654 ] ) {
			expect( pxToMs( msToPx( ms, pxPerMs ), pxPerMs ) ).toBe( ms );
		}
	} );
} );

describe( 'clampToTrim', () => {
	const window = { trimStartMs: 1000, trimEndMs: 9000 };

	it( 'passes through values inside the window', () => {
		expect( clampToTrim( 5000, window ) ).toBe( 5000 );
	} );

	it( 'clamps below the window', () => {
		expect( clampToTrim( 500, window ) ).toBe( 1000 );
	} );

	it( 'clamps above the window', () => {
		expect( clampToTrim( 9500, window ) ).toBe( 9000 );
	} );

	it( 'rounds fractional input', () => {
		expect( clampToTrim( 4999.6, window ) ).toBe( 5000 );
	} );
} );

describe( 'snapMs', () => {
	// 0.1 px/ms with the default 8px threshold → 80ms snap radius.
	const context = { pxPerMs: 0.1, durationMs: 10000 };

	it( 'snaps to zero', () => {
		expect( snapMs( 50, context ) ).toBe( 0 );
	} );

	it( 'snaps to the duration', () => {
		expect( snapMs( 9950, context ) ).toBe( 10000 );
	} );

	it( 'does not snap outside the threshold', () => {
		expect( snapMs( 81, context ) ).toBe( 81 );
	} );

	it( 'snaps exactly at the threshold', () => {
		expect( snapMs( 80, context ) ).toBe( 0 );
	} );

	it( 'snaps to the playhead', () => {
		expect( snapMs( 5060, { ...context, playheadMs: 5000 } ) ).toBe( 5000 );
	} );

	it( 'snaps to segment edges', () => {
		expect( snapMs( 3070, { ...context, edgesMs: [ 3000, 7000 ] } ) ).toBe( 3000 );
	} );

	it( 'picks the nearest target when several are in range', () => {
		expect( snapMs( 60, { ...context, edgesMs: [ 100 ] } ) ).toBe( 100 );
	} );

	it( 'keeps the first target on an exact tie', () => {
		expect( snapMs( 50, { ...context, edgesMs: [ 100 ] } ) ).toBe( 0 );
	} );

	it( 'honors a custom pixel threshold', () => {
		expect( snapMs( 50, { ...context, thresholdPx: 2 } ) ).toBe( 50 );
		expect( snapMs( 15, { ...context, thresholdPx: 2 } ) ).toBe( 0 );
	} );

	it( 'scales the radius with zoom', () => {
		// 1 px/ms → 8ms radius: 50 is no longer near zero.
		expect( snapMs( 50, { pxPerMs: 1, durationMs: 10000 } ) ).toBe( 50 );
		expect( snapMs( 5, { pxPerMs: 1, durationMs: 10000 } ) ).toBe( 0 );
	} );

	it( 'returns the rounded input when snapping is disabled', () => {
		expect( snapMs( 40.4, { pxPerMs: 0, durationMs: 10000 } ) ).toBe( 40 );
	} );

	it( 'rounds the input before comparing', () => {
		expect( snapMs( 4567.6, context ) ).toBe( 4568 );
	} );

	it( 'rounds a fractional snap target', () => {
		expect( snapMs( 5060, { ...context, playheadMs: 5000.4 } ) ).toBe( 5000 );
	} );

	it( 'exposes the default threshold constant', () => {
		expect( DEFAULT_SNAP_THRESHOLD_PX ).toBe( 8 );
	} );
} );

describe( 'formatTimecode', () => {
	it( 'formats zero', () => {
		expect( formatTimecode( 0 ) ).toBe( '0:00:00.0' );
	} );

	it( 'floors to tenths of a second', () => {
		expect( formatTimecode( 99 ) ).toBe( '0:00:00.0' );
		expect( formatTimecode( 100 ) ).toBe( '0:00:00.1' );
		expect( formatTimecode( 1234 ) ).toBe( '0:00:01.2' );
	} );

	it( 'formats minutes and seconds padded', () => {
		expect( formatTimecode( 61234 ) ).toBe( '0:01:01.2' );
		expect( formatTimecode( 600000 ) ).toBe( '0:10:00.0' );
	} );

	it( 'formats hours unpadded', () => {
		expect( formatTimecode( 3661234 ) ).toBe( '1:01:01.2' );
		expect( formatTimecode( 36000000 ) ).toBe( '10:00:00.0' );
	} );

	it( 'stays below the hour flip just under 3600s', () => {
		expect( formatTimecode( 3599999 ) ).toBe( '0:59:59.9' );
	} );

	it( 'clamps negative input to zero', () => {
		expect( formatTimecode( -500 ) ).toBe( '0:00:00.0' );
	} );

	it( 'rounds fractional milliseconds first', () => {
		expect( formatTimecode( 99.7 ) ).toBe( '0:00:00.1' );
	} );
} );

describe( 'pickRulerStep', () => {
	it( 'uses the smallest step when zoomed far in', () => {
		expect( pickRulerStep( 1 ) ).toBe( 100 );
		expect( pickRulerStep( 10 ) ).toBe( 100 );
	} );

	it( 'meets the spacing exactly at the boundary', () => {
		expect( pickRulerStep( MIN_TICK_SPACING_PX / 100 ) ).toBe( 100 );
	} );

	it( 'widens the step as the scale shrinks', () => {
		expect( pickRulerStep( 0.5 ) ).toBe( 200 );
		expect( pickRulerStep( 0.1 ) ).toBe( 1000 );
		expect( pickRulerStep( 0.01 ) ).toBe( 10000 );
		expect( pickRulerStep( 0.002 ) ).toBe( 60000 );
	} );

	it( 'caps at ten minutes when zoomed far out', () => {
		expect( pickRulerStep( 0.0001 ) ).toBe( 600000 );
	} );

	it( 'falls back to the cap for a degenerate scale', () => {
		expect( pickRulerStep( 0 ) ).toBe( 600000 );
		expect( pickRulerStep( -1 ) ).toBe( 600000 );
	} );

	it( 'always returns a value from the step ladder', () => {
		for ( const pxPerMs of [ 5, 1, 0.3, 0.07, 0.004, 0.0002, 0.00001 ] ) {
			expect( RULER_STEPS_MS ).toContain( pickRulerStep( pxPerMs ) );
		}
	} );

	it( 'never picks a step below the spacing threshold when one exists', () => {
		for ( const pxPerMs of [ 5, 1, 0.3, 0.07, 0.004 ] ) {
			expect( pickRulerStep( pxPerMs ) * pxPerMs ).toBeGreaterThanOrEqual( MIN_TICK_SPACING_PX );
		}
	} );

	it( 'keeps the ladder sorted ascending from 100ms to 10min', () => {
		expect( RULER_STEPS_MS[ 0 ] ).toBe( 100 );
		expect( RULER_STEPS_MS[ RULER_STEPS_MS.length - 1 ] ).toBe( 600000 );
		const sorted = [ ...RULER_STEPS_MS ].sort( ( a, b ) => a - b );
		expect( RULER_STEPS_MS ).toEqual( sorted );
	} );
} );
