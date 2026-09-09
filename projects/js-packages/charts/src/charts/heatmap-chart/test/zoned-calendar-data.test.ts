/**
 * @jest-environment <rootDir>/tests/environment-chatham.mjs
 */

// Chatham runs ahead of UTC. A worker behind it renders a UTC-midnight proxy on
// its own day, so it cannot tell the grid's UTC arithmetic from local arithmetic.
import { buildCalendarHeatmapData } from '../private/build-calendar-data';
import type { DataPointDate } from '../../../types';

const labelsCarryingValues = ( data: ReturnType< typeof buildCalendarHeatmapData >[ 'data' ] ) =>
	data.flatMap( column => column.data ).filter( cell => cell.value !== null );

// 2026-08-03 08:00 in Asia/Tokyo, 2026-08-02 16:00 in America/Los_Angeles.
const nearMidnight: DataPointDate[] = [ { date: new Date( '2026-08-02T23:00:00Z' ), value: 7 } ];

describe( 'buildCalendarHeatmapData bucketing in a host time zone', () => {
	test( "buckets an instant on the host's day, not the runtime's", () => {
		const tokyo = buildCalendarHeatmapData( nearMidnight, {
			weekStartsOn: 1,
			timeZone: 'Asia/Tokyo',
		} );
		const losAngeles = buildCalendarHeatmapData( nearMidnight, {
			weekStartsOn: 1,
			timeZone: 'America/Los_Angeles',
		} );

		expect( labelsCarryingValues( tokyo.data ).map( cell => cell.label ) ).toEqual( [
			'Mon, Aug 3, 2026',
		] );
		expect( labelsCarryingValues( losAngeles.data ).map( cell => cell.label ) ).toEqual( [
			'Sun, Aug 2, 2026',
		] );
	} );

	test( 'places the grid on the host zone week, so the two zones differ by a column', () => {
		// Aug 2 2026 is a Sunday and Aug 3 a Monday, so a Monday week start puts the
		// two readings in different weeks entirely.
		const tokyo = buildCalendarHeatmapData( nearMidnight, {
			weekStartsOn: 1,
			timeZone: 'Asia/Tokyo',
		} );

		expect( tokyo.data[ 0 ].data[ 0 ].value ).toBe( 7 );
		expect( tokyo.data[ 0 ].data[ 6 ].hidden ).toBe( true );
	} );

	test( 'a UTC offset works where an IANA name would', () => {
		const { data } = buildCalendarHeatmapData( nearMidnight, {
			weekStartsOn: 1,
			timeZone: '+09:00',
		} );

		expect( labelsCarryingValues( data ).map( cell => cell.label ) ).toEqual( [
			'Mon, Aug 3, 2026',
		] );
	} );
} );

describe( 'buildCalendarHeatmapData date semantics', () => {
	test( 'a bare yyyy-MM-dd is a calendar day, and no zone moves it', () => {
		const series: DataPointDate[] = [ { dateString: '2024-01-03', value: 5 } ];

		for ( const timeZone of [ undefined, 'Asia/Tokyo', 'America/Los_Angeles' ] ) {
			const { data } = buildCalendarHeatmapData( series, { weekStartsOn: 1, timeZone } );
			expect( labelsCarryingValues( data ).map( cell => cell.label ) ).toEqual( [
				'Wed, Jan 3, 2024',
			] );
		}
	} );

	test( 'a datetime with no offset keeps the day it was written with', () => {
		const series: DataPointDate[] = [ { dateString: '2024-01-03T23:30:00', value: 5 } ];
		const { data } = buildCalendarHeatmapData( series, {
			weekStartsOn: 1,
			timeZone: 'Pacific/Kiritimati',
		} );

		expect( labelsCarryingValues( data ).map( cell => cell.label ) ).toEqual( [
			'Wed, Jan 3, 2024',
		] );
	} );

	test( 'a string carrying an offset is an instant, and the host zone re-dates it', () => {
		const series: DataPointDate[] = [ { dateString: '2024-01-03T23:30:00Z', value: 5 } ];
		const { data } = buildCalendarHeatmapData( series, {
			weekStartsOn: 1,
			timeZone: 'Asia/Tokyo',
		} );

		expect( labelsCarryingValues( data ).map( cell => cell.label ) ).toEqual( [
			'Thu, Jan 4, 2024',
		] );
	} );

	test( 'drops an instant no four-digit day key can hold', () => {
		// `Date` reaches year 275760; a wider key would also sort before every other.
		const outOfRange = [ { date: new Date( 1e15 ), value: 3 } ];

		expect( buildCalendarHeatmapData( outOfRange ) ).toEqual( { data: [], rowLabels: [] } );
		expect(
			labelsCarryingValues(
				buildCalendarHeatmapData( [ ...outOfRange, { dateString: '2024-01-03', value: 5 } ], {
					weekStartsOn: 1,
				} ).data
			).map( cell => cell.label )
		).toEqual( [ 'Wed, Jan 3, 2024' ] );
	} );

	test( 'falls through to dateString when date is an Invalid Date', () => {
		const { data } = buildCalendarHeatmapData(
			[ { date: new Date( 'not a date' ), dateString: '2024-01-03', value: 5 } ],
			{ weekStartsOn: 1 }
		);

		expect( labelsCarryingValues( data ).map( cell => cell.label ) ).toEqual( [
			'Wed, Jan 3, 2024',
		] );
	} );

	test( 'drops a written date that names no real day', () => {
		expect( buildCalendarHeatmapData( [ { dateString: '2024-02-30', value: 5 } ] ) ).toEqual( {
			data: [],
			rowLabels: [],
		} );
	} );
} );

describe( 'buildCalendarHeatmapData grid bounds are compared as calendar days', () => {
	// Fri Jan 5 2024, 14:00 UTC. A time of day used to make the bound look earlier
	// than the series and widen the grid; the comparison is on day keys now.
	const afternoon = [ { date: new Date( '2024-01-05T14:00:00Z' ), value: 5 } ];

	test( 'a bound equal to the series start does not widen the grid', () => {
		const { data } = buildCalendarHeatmapData( afternoon, {
			weekStartsOn: 1,
			timeZone: 'UTC',
			gridSpan: { start: '2024-01-05' },
		} );

		// Mon Jan 1 to Thu Jan 4 precede the bound: the ragged edge, not filler.
		expect( data[ 0 ].data.slice( 0, 4 ).map( cell => cell.hidden ) ).toEqual( [
			true,
			true,
			true,
			true,
		] );
		expect( data[ 0 ].data.slice( 0, 4 ).some( cell => cell.placeholder ) ).toBe( false );
	} );

	test( 'a bound genuinely earlier still widens it', () => {
		const { data } = buildCalendarHeatmapData( afternoon, {
			weekStartsOn: 1,
			timeZone: 'UTC',
			gridSpan: { start: '2024-01-04' },
		} );

		expect( data[ 0 ].data.slice( 0, 4 ).every( cell => cell.placeholder === true ) ).toBe( true );
	} );
} );

describe( 'buildCalendarHeatmapData labels in a host locale', () => {
	// Three whole December weeks, so the first month keeps its label.
	const series: DataPointDate[] = [
		{ dateString: '2023-12-11', value: 1 },
		{ dateString: '2024-01-03', value: 5 },
	];

	test( 'writes row, month and cell labels in the locale', () => {
		const { data, rowLabels } = buildCalendarHeatmapData( series, {
			weekStartsOn: 1,
			locale: 'de-DE',
		} );

		expect( rowLabels ).toEqual( [ 'Mo', '', 'Mi', '', 'Fr', '', '' ] );
		expect( data.map( column => column.label ) ).toEqual( [ 'Dez', '', '', 'Jan' ] );
		expect( data[ 3 ].data[ 2 ].label ).toBe( 'Mi., 3. Jan. 2024' );
	} );

	test( 'does not let the locale override an explicit weekStartsOn', () => {
		// de-DE starts its week on Monday; the caller asked for Sunday.
		const { rowLabels } = buildCalendarHeatmapData( series, {
			weekStartsOn: 0,
			locale: 'de-DE',
		} );

		expect( rowLabels ).toEqual( [ 'So', '', 'Di', '', 'Do', '', '' ] );
	} );

	test( 'repairs a WordPress locale and falls back rather than throwing on a bad one', () => {
		expect(
			buildCalendarHeatmapData( series, { weekStartsOn: 1, locale: 'de_DE' } ).rowLabels
		).toEqual( [ 'Mo', '', 'Mi', '', 'Fr', '', '' ] );

		expect( () =>
			buildCalendarHeatmapData( series, {
				weekStartsOn: 1,
				locale: 'not a tag',
				timeZone: 'Nowhere/Fictional',
			} )
		).not.toThrow();
		expect( console ).toHaveWarned();
	} );
} );

describe( 'buildCalendarHeatmapData across a DST transition', () => {
	// Chile moves its clocks on 2024-09-08, at midnight rather than in the small
	// hours, which is where local-midnight day arithmetic loses a day.
	const daily: DataPointDate[] = Array.from( { length: 14 }, ( _, index ) => ( {
		date: new Date( Date.UTC( 2024, 8, 2 + index, 16 ) ),
		value: index,
	} ) );

	test( 'draws every day exactly once', () => {
		const { data } = buildCalendarHeatmapData( daily, {
			weekStartsOn: 1,
			timeZone: 'America/Santiago',
		} );

		expect( data ).toHaveLength( 2 );
		expect( labelsCarryingValues( data ) ).toHaveLength( 14 );
		expect( data[ 0 ].data.map( cell => cell.value ) ).toEqual( [ 0, 1, 2, 3, 4, 5, 6 ] );
		expect( data[ 1 ].data.map( cell => cell.value ) ).toEqual( [ 7, 8, 9, 10, 11, 12, 13 ] );
	} );
} );
