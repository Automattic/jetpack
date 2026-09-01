import { runTestsInTimeZone } from '../../../test-utils/runtime-time-zone';
import { getFormatter, getMaxTicksForWidth, getTimeAxisTickValues } from '../time-axis';
import type { SeriesData } from '../../../types';

// The runtime zone deliberately differs from every zone under test, so a test
// that passes only because the two agree cannot hide here.
runTestsInTimeZone( 'America/Los_Angeles' );

const TOKYO = { timeZone: 'Asia/Tokyo' };

/**
 * One series of hourly points starting at `start`, `count` long.
 * @param start - ISO instant of the first point.
 * @param count - Number of points.
 * @return A single-series fixture.
 */
const hourlySeries = ( start: string, count: number ): SeriesData[] => [
	{
		label: 'views',
		data: Array.from( { length: count }, ( _, index ) => ( {
			date: new Date( new Date( start ).getTime() + index * 60 * 60 * 1000 ),
			value: index,
		} ) ),
	},
];

/**
 * One series of daily points starting at `start`, `count` long.
 * @param start - ISO instant of the first point.
 * @param count - Number of points.
 * @return A single-series fixture.
 */
const dailySeries = ( start: string, count: number ): SeriesData[] => [
	{
		label: 'views',
		data: Array.from( { length: count }, ( _, index ) => ( {
			date: new Date( new Date( start ).getTime() + index * 24 * 60 * 60 * 1000 ),
			value: index,
		} ) ),
	},
];

describe( 'getMaxTicksForWidth', () => {
	it( 'scales with the width and never returns less than one', () => {
		expect( getMaxTicksForWidth( 600 ) ).toBe( 10 );
		expect( getMaxTicksForWidth( 10 ) ).toBe( 1 );
		expect( getMaxTicksForWidth( 0 ) ).toBe( 1 );
	} );
} );

describe( 'getTimeAxisTickValues', () => {
	it( 'returns null when no series carries a date', () => {
		const data: SeriesData[] = [ { label: 'views', data: [ { value: 1 }, { value: 2 } ] } ];
		const formatter = getFormatter( data, undefined, TOKYO );

		expect( getTimeAxisTickValues( data, undefined, formatter, 6 ) ).toBeNull();
	} );

	it( 'selects only points inside the supplied domain', () => {
		const data = dailySeries( '2026-08-01T15:00:00Z', 10 );
		const formatter = getFormatter( data, 'day', TOKYO );
		const domain: [ Date, Date ] = [
			new Date( '2026-08-03T15:00:00Z' ),
			new Date( '2026-08-06T15:00:00Z' ),
		];

		const ticks = getTimeAxisTickValues( data, domain, formatter, 10 );

		expect( ticks ).not.toBeNull();
		for ( const tick of ticks as Date[] ) {
			expect( tick.getTime() ).toBeGreaterThanOrEqual( domain[ 0 ].getTime() );
			expect( tick.getTime() ).toBeLessThanOrEqual( domain[ 1 ].getTime() );
		}
	} );

	it( 'deduplicates points shared by two series', () => {
		const [ first ] = dailySeries( '2026-08-01T15:00:00Z', 4 );
		const data: SeriesData[] = [ first, { ...first, label: 'visitors' } ];
		const formatter = getFormatter( data, 'day', TOKYO );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, 10 ) as Date[];

		expect( new Set( ticks.map( tick => tick.getTime() ) ).size ).toBe( ticks.length );
		expect( ticks.length ).toBeLessThanOrEqual( 4 );
	} );

	it( 'returns the points in ascending order', () => {
		const data = dailySeries( '2026-08-01T15:00:00Z', 8 );
		const formatter = getFormatter( data, 'day', TOKYO );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, 8 ) as Date[];
		const timestamps = ticks.map( tick => tick.getTime() );

		expect( timestamps ).toEqual( [ ...timestamps ].sort( ( a, b ) => a - b ) );
	} );

	it( 'degrades to a single tick when the domain admits one point', () => {
		const data = dailySeries( '2026-08-01T15:00:00Z', 10 );
		const formatter = getFormatter( data, 'day', TOKYO );
		const only = new Date( '2026-08-03T15:00:00Z' );

		const ticks = getTimeAxisTickValues( data, [ only, only ], formatter, 6 ) as Date[];

		expect( ticks ).toHaveLength( 1 );
		expect( ticks[ 0 ].getTime() ).toBe( only.getTime() );
	} );

	it( 'returns an empty array when the domain admits no point', () => {
		const data = dailySeries( '2026-08-01T15:00:00Z', 4 );
		const formatter = getFormatter( data, 'day', TOKYO );
		const gap: [ Date, Date ] = [
			new Date( '2026-09-01T00:00:00Z' ),
			new Date( '2026-09-02T00:00:00Z' ),
		];

		expect( getTimeAxisTickValues( data, gap, formatter, 6 ) ).toEqual( [] );
	} );

	// Japan has no DST, so the Tokyo fixture cannot reach this. New York can.
	// 2026-03-08 is spring forward: the local day is 23 hours long.
	it( 'keeps hourly ticks on the host zone midnight across spring forward', () => {
		const zone = { timeZone: 'America/New_York' };
		// 2026-03-07T05:00Z is midnight in New York; 72 hourly points spans the
		// transition and two further local midnights.
		const data = hourlySeries( '2026-03-07T05:00:00Z', 72 );
		const formatter = getFormatter( data, 'hour', zone );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, 6 ) as Date[];
		const midnightLabels = ticks
			.map( tick => formatter( tick.getTime() ) )
			.filter( label => /\d/.test( label ) && ! /(AM|PM)/.test( label ) );

		// The date-naming ticks must be the local midnights, not 1 AM after the
		// transition, so more than one of them survives the 23 hour day.
		expect( midnightLabels.length ).toBeGreaterThan( 1 );
	} );

	// 2026-11-01 is fall back: the local day is 25 hours long.
	it( 'keeps hourly ticks on the host zone midnight across fall back', () => {
		const zone = { timeZone: 'America/New_York' };
		const data = hourlySeries( '2026-10-31T04:00:00Z', 72 );
		const formatter = getFormatter( data, 'hour', zone );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, 6 ) as Date[];
		const midnightLabels = ticks
			.map( tick => formatter( tick.getTime() ) )
			.filter( label => /\d/.test( label ) && ! /(AM|PM)/.test( label ) );

		expect( midnightLabels.length ).toBeGreaterThan( 1 );
	} );
} );
