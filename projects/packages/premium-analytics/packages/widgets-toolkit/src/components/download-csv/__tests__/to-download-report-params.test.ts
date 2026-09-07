/**
 * Internal dependencies
 */
import { toDownloadReportParams } from '../to-download-report-params';

describe( 'toDownloadReportParams', () => {
	it( 'maps date type and an enabled comparison', () => {
		expect(
			toDownloadReportParams( 'ordersovertime', {
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
				interval: 'day',
				date_type: 'paid',
				comp: '1',
				compare_from: '2026-05-01T00:00:00+02:00',
				compare_to: '2026-05-31T23:59:59+02:00',
			} )
		).toEqual( {
			reportType: 'ordersovertime',
			from: '2026-06-01T00:00:00+02:00',
			to: '2026-06-30T23:59:59+02:00',
			interval: 'day',
			dateType: 'paid',
			compareFrom: '2026-05-01T00:00:00+02:00',
			compareTo: '2026-05-31T23:59:59+02:00',
		} );
	} );

	it( 'omits an incomplete comparison', () => {
		expect(
			toDownloadReportParams( 'ordersovertime', {
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
				interval: 'day',
				comp: '1',
				compare_from: '2026-05-01T00:00:00+02:00',
			} )
		).toEqual( {
			reportType: 'ordersovertime',
			from: '2026-06-01T00:00:00+02:00',
			to: '2026-06-30T23:59:59+02:00',
			interval: 'day',
		} );
	} );
} );
