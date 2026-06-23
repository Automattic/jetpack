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
			{ dateString: '2024-01-29', value: 1 },
			{ dateString: '2024-02-05', value: 1 },
		];
		const { data } = buildCalendarHeatmapData( multiMonth );
		expect( data[ 0 ].label ).toBe( 'Jan' );
		const labels = data.map( c => c.label ).filter( Boolean );
		expect( labels ).toContain( 'Feb' );
	} );
} );
