import { sanitizeStatsDevicesResponse } from '..';
import { devicesFixture, devicesEmptyFixture } from '../__fixtures__/devices';

describe( 'Stats devices normalizer', () => {
	it( 'normalizes top_values into a single data point', () => {
		const result = sanitizeStatsDevicesResponse( devicesFixture, { end_date: '2026-06-25' } );

		expect( result.data ).toHaveLength( 1 );
		expect( result.data[ 0 ].items ).toEqual( [
			{ label: 'Desktop', views: 1000, children: null },
			{ label: 'Mobile', views: 800, children: null },
			{ label: 'Tablet', views: 90, children: null },
		] );
	} );

	it( 'sorts items descending by view count', () => {
		const result = sanitizeStatsDevicesResponse( devicesFixture, { end_date: '2026-06-25' } );
		const views = result.data[ 0 ].items.map( i => i.views );
		expect( views ).toEqual( [ ...views ].sort( ( a, b ) => b - a ) );
	} );

	it( 'returns empty data when top_values is empty', () => {
		const result = sanitizeStatsDevicesResponse( devicesEmptyFixture, { end_date: '2026-06-25' } );
		expect( result.data ).toHaveLength( 0 );
	} );

	it( 'returns empty data for an empty response', () => {
		const result = sanitizeStatsDevicesResponse( {}, { end_date: '2026-06-25' } );
		expect( result.data ).toHaveLength( 0 );
	} );

	it( 'also handles summarized requests (same top_values shape)', () => {
		const result = sanitizeStatsDevicesResponse( devicesFixture, {
			end_date: '2026-06-25',
			summarize: true,
		} );

		expect( result.data[ 0 ].items[ 0 ] ).toMatchObject( { label: 'Desktop', views: 1000 } );
	} );
} );
