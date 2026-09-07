/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { sanitizeReportOrderAttributionSummaryResponse } from '../order-attribution';
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

describe( 'store report sanitizers', () => {
	it( 'strips the offset from rows and from the summary', () => {
		const report = sanitizeReportVisitorsResponse(
			{ data: [ wooRow( '2026-06-15' ) ], summary: wooRow( '2026-06-15' ) },
			SITE_ZONE
		);

		expect( report.data[ 0 ].date_start ).toBe( '2026-06-15T00:00:00' );
		expect( report.data[ 0 ].date_end ).toBe( '2026-06-15T23:59:59' );
		expect( report.summary.date_start ).toBe( '2026-06-15T00:00:00' );
	} );

	// #51499 removed the fabricated `+00:00`, which is the only offset that is not
	// the site's own and so the only one that moves a bucket when it is resolved.
	it( 'resolves a fabricated UTC stamp into the site wall time', () => {
		const report = sanitizeReportVisitorsResponse(
			{ data: [ wooRow( '2026-06-15', 'Z' ) ], summary: wooRow( '2026-06-15', 'Z' ) },
			SITE_ZONE
		);

		expect( report.data[ 0 ].date_start ).toBe( '2026-06-15T08:00:00' );
	} );

	// The offset the server writes is the site's own, so the reader resolves the
	// stripped stamp to the instant it resolved the offset-bearing one to.
	it( 'leaves the instant a reader resolves unchanged', () => {
		const raw = wooRow( '2026-06-15' );
		const report = sanitizeReportVisitorsResponse( { data: [ raw ], summary: raw }, SITE_ZONE );

		expect( localTZDate( report.data[ 0 ].date_start, SITE_ZONE ).getTime() ).toBe(
			localTZDate( raw.date_start, SITE_ZONE ).getTime()
		);
	} );

	it( 'keeps an empty default bound empty', () => {
		const report = sanitizeReportVisitorsResponse(
			{ data: [], summary: { active_sessions: '0', visitors: '0', date_start: '', date_end: '' } },
			SITE_ZONE
		);

		expect( report.summary.date_start ).toBe( '' );
	} );

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
