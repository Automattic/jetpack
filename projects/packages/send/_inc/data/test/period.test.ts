import {
	DEFAULT_STATS_PERIOD,
	bucketUnit,
	coversFromDay,
	groupByWeek,
	parsePeriod,
	periodArgs,
	periodFromKey,
	periodKey,
	periodLabel,
	periodPhrase,
	periodSearch,
	presetDays,
	presetsWithin,
	rangeDates,
	retentionLabel,
	retentionSentence,
	spanDays,
	trimToSince,
} from '../period';
import type { Period, StatsDay } from '../types';

const TODAY = '2026-10-19';

describe( 'parsePeriod', () => {
	const parse = (
		search: Record< string, unknown >,
		fallback: Period | null = null,
		maxDays = 0
	) => parsePeriod( search, fallback, { today: TODAY, maxDays } );

	it.each< [ string, Record< string, unknown >, Period | null ] >( [
		[ 'a preset the router parsed as a number', { range: 30 }, { range: 30 } ],
		[ 'a preset as text', { range: '7' }, { range: 7 } ],
		[ 'custom days', { start: '2026-09-01', end: TODAY }, { start: '2026-09-01', end: TODAY } ],
		[ 'an older link’s days=1 as today', { days: 1 }, { start: TODAY, end: TODAY } ],
		[ 'an older link’s days=30 as the preset', { days: '30' }, { range: 30 } ],
		[ 'an older link’s days=14 as custom days', { days: 14 }, { start: '2026-10-06', end: TODAY } ],
		[ 'no params', {}, null ],
	] )( 'reads %s', ( _, search, period ) => {
		expect( parse( search ) ).toEqual( period );
	} );

	it.each< [ string, Record< string, unknown > ] >( [
		[ 'a range that isn’t a preset', { range: 14 } ],
		[ 'an end before the start', { start: '2026-10-10', end: '2026-10-01' } ],
		[ 'an end after today', { start: '2026-10-01', end: '2026-10-20' } ],
		[ 'a day that doesn’t exist', { start: '2026-02-30', end: '2026-03-02' } ],
		[ 'only one of the two days', { start: '2026-10-01' } ],
	] )( 'falls back on %s', ( _, search ) => {
		expect( parse( search, DEFAULT_STATS_PERIOD ) ).toEqual( DEFAULT_STATS_PERIOD );
	} );

	it( 'caps custom spans when asked', () => {
		const search = { start: '2025-10-18', end: TODAY };
		expect( parse( search, DEFAULT_STATS_PERIOD, 365 ) ).toEqual( DEFAULT_STATS_PERIOD );
		expect( parse( search, DEFAULT_STATS_PERIOD ) ).toEqual( search );
	} );
} );

describe( 'periodSearch and periodArgs', () => {
	it( 'writes nothing for the fallback, and clears every period param', () => {
		expect( periodSearch( { range: 90 }, DEFAULT_STATS_PERIOD ) ).toEqual( {
			range: undefined,
			start: undefined,
			end: undefined,
			days: undefined,
		} );
		expect( periodSearch( null, null ) ).toEqual( periodSearch( { range: 90 }, { range: 90 } ) );
	} );

	it( 'writes a preset as a number, so the router doesn’t quote it, and custom days as text', () => {
		expect( periodSearch( { range: 7 }, null ) ).toMatchObject( { range: 7, start: undefined } );
		expect( periodSearch( { start: '2026-09-01', end: TODAY }, null ) ).toMatchObject( {
			range: undefined,
			start: '2026-09-01',
			end: TODAY,
		} );
	} );

	it( 'round-trips through the address', () => {
		const custom = { start: '2026-09-01', end: TODAY };
		expect(
			parsePeriod( periodSearch( custom, DEFAULT_STATS_PERIOD ), DEFAULT_STATS_PERIOD, {
				today: TODAY,
			} )
		).toEqual( custom );
	} );

	it( 'sends REST args for the period only', () => {
		expect( periodArgs( null ) ).toEqual( {} );
		expect( periodArgs( { range: 1 } ) ).toEqual( { range: 1 } );
		expect( periodArgs( { start: '2026-09-01', end: TODAY } ) ).toEqual( {
			start: '2026-09-01',
			end: TODAY,
		} );
	} );
} );

describe( 'periodKey and periodFromKey', () => {
	it.each< Period >( [ { range: 1 }, { range: 365 }, { start: '2026-09-01', end: TODAY } ] )(
		'round-trips %p',
		period => {
			expect( periodFromKey( periodKey( period ) ) ).toEqual( period );
		}
	);

	it( 'reads the older numeric keys and falls back on junk', () => {
		expect( periodFromKey( 7 ) ).toEqual( { range: 7 } );
		expect( periodFromKey( '30' ) ).toEqual( { range: 30 } );
		expect( periodFromKey( 'r14' ) ).toEqual( DEFAULT_STATS_PERIOD );
		expect( periodFromKey( 's2026-10-19_2026-10-01' ) ).toEqual( DEFAULT_STATS_PERIOD );
	} );
} );

describe( 'labels', () => {
	it( 'calls no period “Any date”', () => {
		expect( periodLabel( null, TODAY ) ).toBe( 'Any date' );
	} );

	it.each< [ Period, string, string ] >( [
		[ { range: 1 }, 'Last 24 hours', 'in the last 24 hours' ],
		[ { range: 90 }, 'Last 90 days', 'in the last 90 days' ],
		[ { start: '2026-09-01', end: TODAY }, 'Sep 1 – Oct 19', 'between Sep 1 and Oct 19' ],
		[ { start: TODAY, end: TODAY }, 'Oct 19', 'on Oct 19' ],
		[
			{ start: '2025-12-01', end: '2026-01-15' },
			'Dec 1, 2025 – Jan 15, 2026',
			'between Dec 1, 2025 and Jan 15, 2026',
		],
		[
			{ start: '2025-03-01', end: '2025-03-09' },
			'Mar 1 – Mar 9, 2025',
			'between Mar 1 and Mar 9, 2025',
		],
	] )( '%p reads “%s” and “%s”', ( period, label, phrase ) => {
		expect( periodLabel( period, TODAY ) ).toBe( label );
		expect( periodPhrase( period, TODAY ) ).toBe( phrase );
	} );

	it( 'shows the year once in the dashboard’s dates line', () => {
		expect( rangeDates( '2026-07-22', TODAY ) ).toBe( 'Jul 22 – Oct 19, 2026' );
		expect( rangeDates( '2025-12-01', '2026-01-15' ) ).toBe( 'Dec 1, 2025 – Jan 15, 2026' );
		expect( rangeDates( TODAY, TODAY ) ).toBe( 'Oct 19, 2026' );
	} );

	it.each< [ number, string, string ] >( [
		[ 7, '1 week', 'Emails are kept for 1 week.' ],
		[ 365, '1 year', 'Emails are kept for 1 year.' ],
		[ 14, '14 days', 'Emails are kept for 14 days.' ],
		[ 0, 'Forever', 'Emails are kept until you delete them.' ],
	] )( 'retention of %d days reads “%s”', ( days, label, sentence ) => {
		expect( retentionLabel( days ) ).toBe( label );
		expect( retentionSentence( days ) ).toBe( sentence );
	} );
} );

describe( 'spans and presets', () => {
	it( 'counts today as day one', () => {
		expect( spanDays( { range: 90 }, TODAY ) ).toBe( 90 );
		expect( spanDays( { start: '2026-10-13', end: TODAY }, TODAY ) ).toBe( 7 );
		expect( presetDays( 7, TODAY ) ).toEqual( { start: '2026-10-13', end: TODAY } );
		expect( presetDays( 1, TODAY ) ).toEqual( { start: TODAY, end: TODAY } );
	} );

	it.each< [ number, number[] ] >( [
		[ 7, [ 1, 7 ] ],
		[ 14, [ 1, 7 ] ],
		[ 1, [ 1 ] ],
		[ 0, [ 1, 7, 30, 90, 180, 365 ] ],
	] )( 'offers only presets inside a %d-day log', ( days, presets ) => {
		expect( presetsWithin( days ) ).toEqual( presets );
	} );

	it.each< [ number, boolean, string ] >( [
		[ 1, false, 'hour' ],
		[ 31, true, 'day' ],
		[ 32, true, 'week' ],
		[ 90, false, 'day' ],
		[ 91, false, 'week' ],
	] )( '%d days on a phone (%p) draws %s bars', ( days, narrow, unit ) => {
		expect( bucketUnit( days, narrow ) ).toBe( unit );
	} );
} );

describe( 'groupByWeek', () => {
	const days = ( from: string, count: number ): StatsDay[] =>
		Array.from( { length: count }, ( _, index ) => {
			const date = new Date( `${ from }T12:00:00Z` );
			date.setUTCDate( date.getUTCDate() + index );
			return { date: date.toISOString().slice( 0, 10 ), sent: 1, fallback: 0, failed: index % 2 };
		} );

	// 2026-10-08 is a Thursday; today (the 19th) is a Monday.
	it.each< [ number, [ string, string, number, boolean ][] ] >( [
		[
			1,
			[
				[ '2026-10-08', '2026-10-11', 4, false ],
				[ '2026-10-12', '2026-10-18', 7, false ],
				[ '2026-10-19', '2026-10-19', 1, true ],
			],
		],
		[
			0,
			[
				[ '2026-10-08', '2026-10-10', 3, false ],
				[ '2026-10-11', '2026-10-17', 7, false ],
				[ '2026-10-18', '2026-10-19', 2, true ],
			],
		],
	] )( 'starts weeks on day %d, with short first and last weeks', ( weekStartsOn, expected ) => {
		const weeks = groupByWeek( days( '2026-10-08', 12 ), weekStartsOn, TODAY );
		expect( weeks.map( week => [ week.start, week.end, week.sent, week.partial ] ) ).toEqual(
			expected
		);
		expect( weeks.reduce( ( sum, week ) => sum + week.failed, 0 ) ).toBe( 6 );
	} );
} );

describe( 'the log’s window', () => {
	it( 'trims days before the first counted one', () => {
		const series = [ '2026-10-15', '2026-10-16', '2026-10-17' ].map( date => ( {
			date,
			sent: 0,
			fallback: 0,
			failed: 0,
		} ) );
		expect( trimToSince( series, '2026-10-16' ).map( day => day.date ) ).toEqual( [
			'2026-10-16',
			'2026-10-17',
		] );
		expect( trimToSince( series, null ) ).toBe( series );
	} );

	it( 'starts the Log’s calendar on the oldest email’s day, or today when empty', () => {
		expect( coversFromDay( { log_covers_from: '2026-10-12 23:30:00' }, TODAY ) ).toBe(
			'2026-10-12'
		);
		expect( coversFromDay( { log_covers_from: null }, TODAY ) ).toBe( TODAY );
	} );
} );
