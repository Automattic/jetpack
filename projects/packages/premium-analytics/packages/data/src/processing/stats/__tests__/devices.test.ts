import { sanitizeStatsDevicesResponse } from '..';
import { devicesFixture, devicesSummaryFixture } from '../__fixtures__/devices';

describe( 'Stats devices normalizer', () => {
	it( 'normalizes summarized devices into a single range data point', () => {
		const result = sanitizeStatsDevicesResponse( devicesSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.data ).toHaveLength( 1 );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
				items: [
					{ label: 'desktop', views: 5000, children: null },
					{ label: 'mobile', views: 3200, children: null },
					{ label: 'tablet', views: 450, children: null },
				],
			} )
		);
	} );

	it( 'sorts items descending by view count', () => {
		const result = sanitizeStatsDevicesResponse( devicesSummaryFixture, {
			end_date: '2026-06-22',
			summarize: true,
		} );

		const views = result.data[ 0 ].items.map( i => i.views );
		expect( views ).toEqual( [ ...views ].sort( ( a, b ) => b - a ) );
	} );

	it( 'normalizes non-summarized devices into by-date data points', () => {
		const result = sanitizeStatsDevicesResponse( devicesFixture, {
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( {} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					{ label: 'desktop', views: 1000, children: null },
					{ label: 'mobile', views: 800, children: null },
					{ label: 'tablet', views: 90, children: null },
				],
			} )
		);
	} );

	it( 'excludes other_views and aggregate views keys from items', () => {
		const result = sanitizeStatsDevicesResponse( devicesFixture, {
			end_date: '2026-06-16',
		} );

		const labels = result.data[ 0 ].items.map( i => i.label );
		expect( labels ).not.toContain( 'other_views' );
		expect( labels ).not.toContain( 'views' );
	} );

	it( 'returns empty data for an empty response', () => {
		const result = sanitizeStatsDevicesResponse( {}, { end_date: '2026-06-16' } );

		expect( result.summary ).toEqual( {} );
		expect( result.data ).toHaveLength( 0 );
	} );
} );
