import { runTestsInTimeZone } from '../../../test-utils/runtime-time-zone';
import { getBandTickValues, getFormatter } from '../time-axis';
import type { useChartDataTransform } from '../../../hooks';

type SortedData = ReturnType< typeof useChartDataTransform >;

const toSeries = ( dates: Date[] ): SortedData =>
	[
		{
			label: 'series',
			data: dates.map( date => ( { date, value: 1 } ) ),
		},
	] as unknown as SortedData;

// Tokyo has no DST, so its midnight is a fixed nine hours before UTC midnight.
const tokyoMidnight = ( year: number, month: number, day = 1 ) =>
	new Date( Date.UTC( year, month, day ) - 9 * 60 * 60 * 1000 );

const every = ( start: Date, count: number, hours: number ): Date[] =>
	Array.from(
		{ length: count },
		( _, i ) => new Date( start.getTime() + i * hours * 60 * 60 * 1000 )
	);

// A formatter that ignores its context reads Los Angeles here, and the instants
// below land on a different calendar day there than in Tokyo. The runtime locale
// stays en-US, so a German label can only come from the supplied context.
runTestsInTimeZone( 'America/Los_Angeles' );

describe( 'getFormatter with a host formatting context', () => {
	const daily = toSeries( every( new Date( '2026-08-02T12:00:00Z' ), 14, 24 ) );

	it( 'labels date ticks in the supplied locale', () => {
		const format = getFormatter( daily, undefined, { locale: 'de-DE' } );

		expect( format( Date.parse( '2026-08-02T12:00:00Z' ) ) ).toBe( '2. Aug.' );
	} );

	it( "labels date ticks on the supplied zone's calendar day", () => {
		const format = getFormatter( daily, undefined, { timeZone: 'Asia/Tokyo' } );

		// 00:30 on Aug 3 in Tokyo, still Aug 2 in the runtime zone.
		expect( format( Date.parse( '2026-08-02T15:30:00Z' ) ) ).toBe( 'Aug 3' );
	} );

	it( 'falls back to the runtime locale and zone when given no context', () => {
		expect( getFormatter( daily )( Date.parse( '2026-08-02T15:30:00Z' ) ) ).toBe( 'Aug 2' );
	} );

	it( 'anchors the date label to midnight in the supplied zone', () => {
		// Three days of hourly buckets: hour ticks, dated at midnight.
		const hourly = toSeries( every( tokyoMidnight( 2026, 7, 1 ), 72, 1 ) );
		const format = getFormatter( hourly, undefined, { timeZone: 'Asia/Tokyo' } );

		// Midnight in Tokyo, 08:00 the previous day in the runtime zone.
		expect( format( tokyoMidnight( 2026, 7, 2 ).getTime() ) ).toBe( 'Aug 2' );
		// Midnight in the runtime zone, 16:00 in Tokyo.
		expect( format( Date.parse( '2026-08-02T07:00:00Z' ) ) ).toBe( '4 PM' );
	} );

	it( 'anchors the year label to January in the supplied zone', () => {
		const monthly = toSeries(
			Array.from( { length: 12 }, ( _, i ) => tokyoMidnight( 2025, 7 + i ) )
		);
		const format = getFormatter( monthly, undefined, { timeZone: 'Asia/Tokyo' } );

		// January 1 in Tokyo, December 31 in the runtime zone.
		expect( format( tokyoMidnight( 2026, 0 ).getTime() ) ).toBe( '2026' );
		expect( format( tokyoMidnight( 2026, 1 ).getTime() ) ).toBe( 'Feb' );
	} );
} );

describe( 'getBandTickValues with a host formatting context', () => {
	it( "puts the year tick on the supplied zone's January bucket", () => {
		const domain = Array.from( { length: 12 }, ( _, i ) => tokyoMidnight( 2025, 7 + i ) );
		const format = getFormatter( toSeries( domain ), undefined, {
			locale: 'de-DE',
			timeZone: 'Asia/Tokyo',
		} );

		const values = getBandTickValues( domain, format, 4 );

		expect( values.find( date => format( date.getTime() ) === '2026' ) ).toEqual(
			tokyoMidnight( 2026, 0 )
		);
	} );
} );
