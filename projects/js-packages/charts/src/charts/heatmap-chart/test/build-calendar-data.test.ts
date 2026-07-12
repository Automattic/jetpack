import { buildCalendarHeatmapData } from '../private/build-calendar-data';
import type { DataPointDate } from '../../../types';

const series: DataPointDate[] = [
	{ dateString: '2024-01-01', value: 3 }, // Mon
	{ dateString: '2024-01-03', value: 5 }, // Wed
	{ dateString: '2024-01-15', value: 2 }, // Mon (3rd week)
];

describe( 'buildCalendarHeatmapData', () => {
	test( 'returns empty result for empty input', () => {
		expect( buildCalendarHeatmapData( [] ) ).toEqual( { data: [], rowLabels: [] } );
	} );

	test( 'groups days into week columns of 7 rows', () => {
		const { data } = buildCalendarHeatmapData( series );
		expect( data ).toHaveLength( 3 ); // weeks containing Jan 1, Jan 8, Jan 15
		data.forEach( column => expect( column.data ).toHaveLength( 7 ) );
	} );

	test( 'Monday week start places Jan 1 (Mon) in row 0', () => {
		const { data, rowLabels } = buildCalendarHeatmapData( series, { weekStartsOn: 1 } );
		expect( data[ 0 ].data[ 0 ].value ).toBe( 3 );
		expect( data[ 0 ].data[ 2 ].value ).toBe( 5 ); // Wed
		expect( rowLabels[ 0 ] ).toBe( 'Mon' );
		expect( rowLabels[ 2 ] ).toBe( 'Wed' );
		expect( rowLabels[ 4 ] ).toBe( 'Fri' );
		expect( rowLabels[ 1 ] ).toBe( '' );
	} );

	test( 'fills missing days with null', () => {
		const { data } = buildCalendarHeatmapData( series );
		expect( data[ 0 ].data[ 1 ].value ).toBeNull(); // Tue Jan 2 has no datum
	} );

	test( 'labels only the first column of each month', () => {
		const multiMonth: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 1 },
			{ dateString: '2024-02-05', value: 1 },
		];
		const { data } = buildCalendarHeatmapData( multiMonth );
		expect( data[ 0 ].label ).toBe( 'Jan' );
		const labels = data.map( c => c.label ).filter( Boolean );
		expect( labels ).toContain( 'Feb' );
	} );

	test( 'suppresses a partial first month label so it cannot collide with the next', () => {
		// Jan 29 is the only January column; February should be the first visible label.
		const partialFirstMonth: DataPointDate[] = [
			{ dateString: '2024-01-29', value: 1 },
			{ dateString: '2024-02-05', value: 1 },
		];
		const { data } = buildCalendarHeatmapData( partialFirstMonth, { weekStartsOn: 1 } );
		expect( data[ 0 ].label ).toBe( '' );
		expect( data.map( c => c.label ).filter( Boolean )[ 0 ] ).toBe( 'Feb' );
	} );

	test( 'keeps the first month label when the range never reaches a second month', () => {
		// Single-month ranges keep their lone month label.
		const singleMonth: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 1 },
			{ dateString: '2024-01-03', value: 2 },
		];
		const { data } = buildCalendarHeatmapData( singleMonth, { weekStartsOn: 1 } );
		expect( data ).toHaveLength( 1 );
		expect( data[ 0 ].label ).toBe( 'Jan' );
	} );

	test( 'filters out entries with unparseable or missing dates', () => {
		const mixed: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 3 },
			{ dateString: 'not-a-date', value: 9 },
			{ date: new Date( NaN ), value: 7 },
			{ value: 1 }, // neither date nor dateString
		];
		const { data } = buildCalendarHeatmapData( mixed );
		expect( data ).toHaveLength( 1 ); // only Jan 1 survives -> one week column
		const values = data.flatMap( column => column.data.map( cell => cell.value ) );
		expect( values ).toContain( 3 );
		expect( values ).not.toContain( 9 );
		expect( values ).not.toContain( 7 );
	} );

	test( 'returns empty result when every entry has an invalid date', () => {
		const allInvalid: DataPointDate[] = [
			{ dateString: 'nope', value: 1 },
			{ date: new Date( NaN ), value: 2 },
		];
		expect( buildCalendarHeatmapData( allInvalid ) ).toEqual( { data: [], rowLabels: [] } );
	} );

	test( 'duplicate days keep the last value (no aggregation)', () => {
		const dupes: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 3 },
			{ dateString: '2024-01-01', value: 8 },
		];
		const { data } = buildCalendarHeatmapData( dupes, { weekStartsOn: 1 } );
		expect( data[ 0 ].data[ 0 ].value ).toBe( 8 ); // last write wins, not summed to 11
	} );

	test( 'Sunday week start shifts rows and labels (Sun/Tue/Thu)', () => {
		// gridStart snaps to Sun Dec 31 2023, so Mon Jan 1 lands in row 1.
		const { data, rowLabels } = buildCalendarHeatmapData( series, { weekStartsOn: 0 } );
		expect( data[ 0 ].data[ 1 ].value ).toBe( 3 ); // Mon Jan 1
		expect( data[ 0 ].data[ 3 ].value ).toBe( 5 ); // Wed Jan 3
		expect( rowLabels[ 0 ] ).toBe( 'Sun' );
		expect( rowLabels[ 2 ] ).toBe( 'Tue' );
		expect( rowLabels[ 4 ] ).toBe( 'Thu' );
	} );
} );
