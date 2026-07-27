/**
 * Internal dependencies
 */
import { buildSalesByUtmData } from '../build-sales-by-utm-data';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

const report: ReportDataMap[ 'order-attribution' ] = {
	view: 'source',
	order_by: 'net_sales',
	data: [
		{
			item: 'Search',
			current_period: { value: 100, intervals: [] },
			previous_period: { value: 200, intervals: [] },
		},
		{
			item: 'Email',
			current_period: { value: 50, intervals: [] },
			previous_period: { value: 25, intervals: [] },
		},
		{
			item: 'Hidden by limit',
			current_period: { value: 1000, intervals: [] },
			previous_period: { value: 1000, intervals: [] },
		},
	],
};

describe( 'buildSalesByUtmData', () => {
	it( 'shares one scale across both periods for the visible rows', () => {
		const data = buildSalesByUtmData( report, 2 );

		expect( data ).toHaveLength( 2 );
		expect( data[ 0 ] ).toMatchObject( {
			currentShare: 50,
			previousShare: 100,
		} );
	} );

	it( 'keeps every row when maxEntries is 0', () => {
		const data = buildSalesByUtmData( report, 0 );

		expect( data ).toHaveLength( 3 );
		// The third row's 1000 now sets the shared scale for every row.
		expect( data[ 0 ] ).toMatchObject( {
			currentShare: 10,
			previousShare: 20,
		} );
	} );
} );
