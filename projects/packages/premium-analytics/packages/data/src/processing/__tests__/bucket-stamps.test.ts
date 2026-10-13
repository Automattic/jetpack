/**
 * Internal dependencies
 */
import { sanitizeReportBookingsResponse } from '../bookings';
import { sanitizeReportConversionRateResponse } from '../conversion-rate';
import { sanitizeReportCouponsByDateResponse } from '../coupons-by-date';
import { sanitizeReportCustomersByDateResponse } from '../customers-by-date';
import { sanitizeReportOrderAttributionSummaryResponse } from '../order-attribution';
import { sanitizeReportOrdersResponse } from '../orders';
import { withBucketStamps } from '../utils';
import { sanitizeReportVisitorsResponse } from '../visitors';

const SITE_ZONE = 'Asia/Taipei';

// The shape wpcom's `format( 'c' )` writes: the site's own offset, not UTC.
const wooRow = ( timeInterval: string, offset = '+08:00' ) => ( {
	time_interval: timeInterval,
	date_start: `${ timeInterval }T00:00:00${ offset }`,
	date_end: `${ timeInterval }T23:59:59${ offset }`,
	active_sessions: '3',
	visitors: '2',
} );

describe( 'withBucketStamps', () => {
	it( 'normalizes both bounds and leaves the rest of the row alone', () => {
		expect( withBucketStamps( wooRow( '2026-06-15' ), SITE_ZONE ) ).toEqual( {
			time_interval: '2026-06-15',
			date_start: '2026-06-15T00:00:00',
			date_end: '2026-06-15T23:59:59',
			active_sessions: '3',
			visitors: '2',
		} );
	} );
} );

type BoundedReport = {
	summary: { date_start: string; date_end: string };
	data: Array< { date_start: string; date_end: string } >;
};

// A `Z` bound, so an assertion on it only holds when the sanitizer threaded the
// reporting zone: stripping the offset textually would leave 00:00 in place.
const zoneThreadingSanitizers = [
	[ 'bookings', sanitizeReportBookingsResponse ],
	[ 'conversion rate', sanitizeReportConversionRateResponse ],
	[ 'coupons by date', sanitizeReportCouponsByDateResponse ],
	[ 'customers by date', sanitizeReportCustomersByDateResponse ],
	[ 'orders', sanitizeReportOrdersResponse ],
	[ 'visitors', sanitizeReportVisitorsResponse ],
] as Array< [ string, ( response: never, zone: string ) => BoundedReport ] >;

describe.each( zoneThreadingSanitizers )( '%s sanitizer', ( _name, sanitize ) => {
	it( 'resolves both bounds in the reporting zone', () => {
		const row = wooRow( '2026-06-15', 'Z' );
		const report = sanitize( { data: [ row ], summary: row } as never, SITE_ZONE );

		expect( report.data[ 0 ].date_start ).toBe( '2026-06-15T08:00:00' );
		expect( report.summary.date_end ).toBe( '2026-06-16T07:59:59' );
	} );
} );

describe( 'store report sanitizers', () => {
	// This one lists its output fields instead of spreading, so it drifts on its own.
	it( 'stamps order attribution intervals in both periods', () => {
		const period = {
			value: '10',
			intervals: [
				{
					time_interval: '2026-06-15',
					date_start: '2026-06-15T00:00:00+08:00',
					date_end: '2026-06-15T23:59:59+08:00',
					net_sales: '10',
				},
			],
		};
		const report = sanitizeReportOrderAttributionSummaryResponse(
			{
				view: 'channel',
				order_by: 'net_sales',
				data: [ { item: 'direct', current_period: period, previous_period: period } ],
			},
			SITE_ZONE
		);

		expect( report.data[ 0 ].current_period.intervals[ 0 ].date_start ).toBe(
			'2026-06-15T00:00:00'
		);
		expect( report.data[ 0 ].previous_period.intervals[ 0 ].date_end ).toBe(
			'2026-06-15T23:59:59'
		);
	} );
} );
