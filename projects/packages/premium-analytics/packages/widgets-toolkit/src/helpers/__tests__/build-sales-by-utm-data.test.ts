/**
 * External dependencies
 */
import { buildSalesByUtmData } from '../build-sales-by-utm-data';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */

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
} );
