/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { dailySeries, hourlySeries } from '../../../test-utils/series-fixtures';
import { getFormatter, getMaxTicksForWidth, getTimeAxisTickValues } from '../time-axis';
import type { DataPointDate, SeriesData } from '../../../types';

// The runtime zone deliberately differs from every zone under test, so a test
// that passes only because the two agree cannot hide here.
const TOKYO = { timeZone: 'Asia/Tokyo' };

const localTimes = ( ticks: Date[], timeZone: string ) =>
	ticks.map( tick =>
		new Intl.DateTimeFormat( 'en-US', {
			timeZone,
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		} ).format( tick )
	);

describe( 'getMaxTicksForWidth', () => {
	it( 'scales with the width and never returns less than one', () => {
		expect( getMaxTicksForWidth( 600 ) ).toBe( 10 );
		expect( getMaxTicksForWidth( 10 ) ).toBe( 1 );
		expect( getMaxTicksForWidth( 0 ) ).toBe( 1 );
	} );
} );

// One label is `span / maxTicks` wide, so anything closer overlaps its neighbour.
const closestGap = ( ticks: Date[] ) =>
	ticks
		.slice( 1 )
		.reduce(
			( nearest, tick, index ) => Math.min( nearest, tick.getTime() - ticks[ index ].getTime() ),
			Infinity
		);

const joinSeries = ( label: string, ...parts: SeriesData[][] ): SeriesData[] => [
	{ label, data: parts.flatMap( ( [ series ] ) => series.data as DataPointDate[] ) },
];

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

	// An index stride is a pixel stride only on evenly spaced points: sampling a
	// gapped series by index piles every tick into the two ends.
	it( 'spreads ticks over a long gap rather than crowding its ends', () => {
		const data = joinSeries(
			'views',
			dailySeries( '2026-01-01T00:00:00Z', 10 ),
			dailySeries( '2026-03-11T00:00:00Z', 10 )
		);
		const formatter = getFormatter( data, 'day', TOKYO );
		const maxTicks = getMaxTicksForWidth( 700 );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, maxTicks ) as Date[];
		const span = 78 * 24 * 60 * 60 * 1000;

		expect( ticks.length ).toBeGreaterThan( maxTicks / 2 );
		expect( closestGap( ticks ) ).toBeGreaterThanOrEqual( ( span / maxTicks ) * 0.9 );
	} );

	it( 'keeps a usable axis when two series sit on different grids', () => {
		const data = [
			...hourlySeries( '2026-01-01T00:00:00Z', 24 ),
			{ ...dailySeries( '2026-01-01T00:00:00Z', 10 )[ 0 ], label: 'visitors' },
		];
		const formatter = getFormatter( data, undefined, TOKYO );
		const maxTicks = getMaxTicksForWidth( 700 );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, maxTicks ) as Date[];

		// The 24 same-day points share one label, which used to veto every stride
		// and leave the ten day axis with two ticks.
		expect( ticks.length ).toBeGreaterThan( maxTicks / 2 );
		expect( new Set( ticks.map( tick => formatter( tick.getTime() ) ) ).size ).toBe( ticks.length );
	} );

	it( 'still samples evenly spaced points by index', () => {
		const data = dailySeries( '2026-01-01T00:00:00Z', 90 );
		const formatter = getFormatter( data, 'day', TOKYO );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, 11 ) as Date[];
		const gaps = ticks
			.slice( 1 )
			.map( ( tick, index ) => tick.getTime() - ticks[ index ].getTime() );

		expect( ticks ).toHaveLength( 11 );
		expect( new Set( gaps ).size ).toBe( 1 );
	} );

	// Past a week of hourly data the axis switches to bare dates, which used to
	// drop the boundary steering with the hour label: a tick reading "Aug 3" sat
	// 14 hours into Aug 3.
	it( 'keeps date ticks on host zone midnight once hourly data outgrows the hour format', () => {
		const data = hourlySeries( '2026-08-01T15:00:00Z', 8 * 24 );
		const formatter = getFormatter( data, 'hour', TOKYO );

		const ticks = getTimeAxisTickValues(
			data,
			undefined,
			formatter,
			getMaxTicksForWidth( 700 )
		) as Date[];

		expect( ticks.length ).toBeGreaterThan( 4 );
		expect( localTimes( ticks, TOKYO.timeZone ) ).toEqual( ticks.map( () => '00:00' ) );
	} );

	// Both tick paths have to honour the same anchors: the fallback used to read
	// only the boundary-test kind, so a date tick could sit hours into its day.
	it( 'opens the day on unevenly sampled hourly data, where ticks come from position', () => {
		const dates = Array.from( { length: 10 * 24 }, ( _, index ) => index )
			.filter( index => index % 7 !== 3 && index % 11 !== 5 )
			.map( index => new Date( Date.UTC( 2026, 7, 1, 15 + index ) ) );
		const data: SeriesData[] = [
			{ label: 'views', data: dates.map( ( date, index ) => ( { date, value: index } ) ) },
		];
		const formatter = getFormatter( data, 'hour', TOKYO );

		const ticks = getTimeAxisTickValues(
			data,
			undefined,
			formatter,
			getMaxTicksForWidth( 700 )
		) as Date[];

		expect( ticks.length ).toBeGreaterThan( 4 );
		for ( const tick of ticks ) {
			const label = formatter( tick.getTime() );
			const opensTheDay = dates.find( date => formatter( date.getTime() ) === label );
			expect( tick.getTime() ).toBe( opensTheDay?.getTime() );
		}
	} );

	// A brush over a sparse stretch, or a caller's own wide xScale.domain: the
	// ticks answer to the scale, so they have to reach across all of it rather
	// than pile into the sliver that carries points.
	it( 'spreads ticks over a domain far wider than the data inside it', () => {
		const data = dailySeries( '2026-01-05T00:00:00Z', 6 );
		const domain: [ Date, Date ] = [
			new Date( '2026-01-05T00:00:00Z' ),
			new Date( '2026-03-05T00:00:00Z' ),
		];
		const formatter = getFormatter( data, 'day', TOKYO, domain );
		const maxTicks = getMaxTicksForWidth( 700 );
		const span = domain[ 1 ].getTime() - domain[ 0 ].getTime();

		const ticks = getTimeAxisTickValues( data, domain, formatter, maxTicks ) as Date[];

		expect( ticks.length ).toBeGreaterThan( maxTicks / 2 );
		expect( ticks[ ticks.length - 1 ].getTime() ).toBeGreaterThan(
			domain[ 0 ].getTime() + span * 0.9
		);
		expect( closestGap( ticks ) ).toBeGreaterThanOrEqual( ( span / maxTicks ) * 0.9 );
	} );

	// Japan has no DST, so the Tokyo fixture cannot reach this. New York can.
	// 2026-03-08 is spring forward: the local day is 23 hours long.
	it( 'names the first host zone midnights across spring forward, then drifts an hour', () => {
		const zone = { timeZone: 'America/New_York' };
		// 2026-03-07T05:00Z is midnight in New York; 72 hourly points spans the
		// transition and two further local midnights.
		const data = hourlySeries( '2026-03-07T05:00:00Z', 72 );
		const formatter = getFormatter( data, 'hour', zone );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, 6 ) as Date[];

		expect( ticks.map( tick => formatter( tick.getTime() ) ) ).toEqual( [
			'Mar 7',
			'12 PM',
			'Mar 8',
			'1 PM',
			'1 AM',
			'1 PM',
		] );
		// An even stride wins the density comparison over the midnight anchors,
		// so once the 23 hour day shifts them the last date lands at 01:00.
		expect( localTimes( ticks, zone.timeZone ) ).toEqual( [
			'00:00',
			'12:00',
			'00:00',
			'13:00',
			'01:00',
			'13:00',
		] );
	} );

	// 2026-11-01 is fall back: the local day is 25 hours long.
	it( 'names the first host zone midnights across fall back, then drifts an hour', () => {
		const zone = { timeZone: 'America/New_York' };
		const data = hourlySeries( '2026-10-31T04:00:00Z', 72 );
		const formatter = getFormatter( data, 'hour', zone );

		const ticks = getTimeAxisTickValues( data, undefined, formatter, 6 ) as Date[];

		expect( ticks.map( tick => formatter( tick.getTime() ) ) ).toEqual( [
			'Oct 31',
			'12 PM',
			'Nov 1',
			'11 AM',
			'11 PM',
			'11 AM',
		] );
		expect( localTimes( ticks, zone.timeZone ) ).toEqual( [
			'00:00',
			'12:00',
			'00:00',
			'11:00',
			'23:00',
			'11:00',
		] );
	} );
} );
