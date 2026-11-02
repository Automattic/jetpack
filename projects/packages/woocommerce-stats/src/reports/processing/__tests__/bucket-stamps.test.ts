/**
 * Internal dependencies
 */
import { sanitizeReportBookingsResponse } from '../bookings';
import { sanitizeReportConversionRateResponse } from '../conversion-rate';
import { sanitizeReportCouponsByDateResponse } from '../coupons-by-date';
import { sanitizeReportCustomersByDateResponse } from '../customers-by-date';
import { sanitizeReportOrderAttributionSummaryResponse } from '../order-attribution';
import { sanitizeReportOrdersResponse } from '../orders';
import { sanitizeReportVisitorsResponse } from '../visitors';

// The dashboard owns the conversion; these tests cover which bounds go through it, and in which zone.
jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	toBucketStamp: ( raw: string, zone: string ) => `${ raw } in ${ zone }`,
} ) );

const SITE_ZONE = 'Asia/Taipei';

const bounds = {
	date_start: '2026-06-15T00:00:00+08:00',
	date_end: '2026-06-15T23:59:59+08:00',
};

const stamped = {
	date_start: `${ bounds.date_start } in ${ SITE_ZONE }`,
	date_end: `${ bounds.date_end } in ${ SITE_ZONE }`,
};

type BoundedReport = {
	summary: { date_start: string; date_end: string };
	data: Array< { date_start: string; date_end: string } >;
};

const sanitizers = [
	[ 'bookings', sanitizeReportBookingsResponse ],
	[ 'conversion rate', sanitizeReportConversionRateResponse ],
	[ 'coupons by date', sanitizeReportCouponsByDateResponse ],
	[ 'customers by date', sanitizeReportCustomersByDateResponse ],
	[ 'orders', sanitizeReportOrdersResponse ],
	[ 'visitors', sanitizeReportVisitorsResponse ],
] as Array< [ string, ( response: never, zone: string ) => BoundedReport ] >;

describe.each( sanitizers )( '%s sanitizer', ( _name, sanitize ) => {
	it( 'stamps the bounds of its rows and of its summary in the report zone', () => {
		const row = { time_interval: '2026-06-15', ...bounds };
		const report = sanitize( { data: [ row ], summary: row } as never, SITE_ZONE );

		expect( report.data[ 0 ] ).toMatchObject( stamped );
		expect( report.summary ).toMatchObject( stamped );
	} );
} );

describe( 'order attribution sanitizer', () => {
	// It lists its output fields instead of spreading a row, so it drifts on its own.
	it( 'stamps the intervals of both periods', () => {
		const period = {
			value: '10',
			intervals: [ { time_interval: '2026-06-15', net_sales: '10', ...bounds } ],
		};
		const report = sanitizeReportOrderAttributionSummaryResponse(
			{
				view: 'channel',
				order_by: 'net_sales',
				data: [ { item: 'direct', current_period: period, previous_period: period } ],
			},
			SITE_ZONE
		);

		expect( report.data[ 0 ].current_period.intervals[ 0 ] ).toMatchObject( stamped );
		expect( report.data[ 0 ].previous_period.intervals[ 0 ] ).toMatchObject( stamped );
	} );
} );
