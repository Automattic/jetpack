/**
 * Internal dependencies
 */
import { fetchReport } from '../../fetch-report';
import { fetchReportBookings } from '../report-bookings-fetch';
import { fetchReportCouponsByDate } from '../report-coupons-by-date-fetch';
import { fetchReportCoupons } from '../report-coupons-fetch';
import { fetchReportCustomersByDate } from '../report-customers-by-date-fetch';
import { fetchReportCustomers } from '../report-customers-fetch';
import { fetchReportOrderAttributionByProduct } from '../report-order-attribution-by-product-fetch';
import { fetchReportOrderAttributionSummary } from '../report-order-attribution-summary-fetch';
import { fetchReportOrders } from '../report-orders-fetch';
import { fetchReportProducts } from '../report-products-fetch';

jest.mock( '../../fetch-report' );

const mockFetchReport = jest.mocked( fetchReport );

const RANGE = { from: '2026-06-01', to: '2026-06-30', interval: 'day' };

const FETCHERS = [
	[ 'bookings', fetchReportBookings ],
	[ 'coupons', fetchReportCoupons ],
	[ 'coupons by date', fetchReportCouponsByDate ],
	[ 'customers', fetchReportCustomers ],
	[ 'customers by date', fetchReportCustomersByDate ],
	[ 'order attribution by product', fetchReportOrderAttributionByProduct ],
	[ 'order attribution summary', fetchReportOrderAttributionSummary ],
	[ 'orders', fetchReportOrders ],
	[ 'products', fetchReportProducts ],
] as const;

async function sentDateType(
	fetcher: ( typeof FETCHERS )[ number ][ 1 ],
	params: Record< string, unknown >
) {
	mockFetchReport.mockResolvedValue( { data: [], summary: {}, totals: {} } );
	await ( fetcher as ( p: unknown ) => Promise< unknown > )( { ...RANGE, ...params } );

	return mockFetchReport.mock.calls[ 0 ][ 1 ]?.date_type;
}

afterEach( () => {
	jest.resetAllMocks();
	delete ( window as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe.each( FETCHERS )( 'the %s report', ( _, fetcher ) => {
	it.each( [
		[ "the store's date type", { date_type: 'created' }, {}, 'created' ],
		[ 'paid without one', undefined, {}, 'paid' ],
		[
			'the date type its params name',
			{ date_type: 'created' },
			{ date_type: 'completed' },
			'completed',
		],
	] )( 'sends %s', async ( __, storeData, params, expected ) => {
		( window as { JetpackScriptData?: unknown } ).JetpackScriptData = {
			woocommerce_stats: storeData,
		};

		await expect( sentDateType( fetcher, params ) ).resolves.toBe( expected );
	} );
} );
