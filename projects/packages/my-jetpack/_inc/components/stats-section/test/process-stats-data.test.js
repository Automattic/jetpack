import { processStatsData } from '../index';

const rows = count =>
	Array.from( { length: count }, ( _, index ) => {
		const date = new Date( Date.UTC( 2026, 0, 1 + index ) ).toISOString().slice( 0, 10 );
		return [ date, index + 1, 0, 0, 0 ];
	} );

const sum = ( from, to ) => ( ( from + to ) * ( to - from + 1 ) ) / 2;

describe( 'processStatsData', () => {
	it.each( [ 7, 30 ] )( 'splits twice %d days into the latest days and those before', days => {
		const { counts, previousCounts, chartData } = processStatsData(
			{ fields: [ 'period', 'views', 'visitors', 'likes', 'comments' ], data: rows( days * 2 ) },
			days
		);

		expect( counts.views ).toBe( sum( days + 1, days * 2 ) );
		expect( previousCounts.views ).toBe( sum( 1, days ) );
		expect( chartData.data ).toHaveLength( days );
		expect( chartData.data[ 0 ][ 1 ] ).toBe( days + 1 );
	} );
} );
