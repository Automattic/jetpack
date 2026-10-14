/**
 * External dependencies
 */
import { toBucketStamp, useReport } from '@automattic/jetpack-premium-analytics-sdk';
import apiFetch from '@wordpress/api-fetch';
import { getSettings } from '@wordpress/date';
import { addQueryArgs } from '@wordpress/url';
import type { ReportQuery, ReportResult } from '@automattic/jetpack-premium-analytics-sdk';

/** The dashboard's report params, as far as this report reads them. */
export type ReportParams = {
	from: string;
	to: string;
	interval: string;
	date_type?: string;
	compare_from?: string;
	compare_to?: string;
};

/** A row of the orders report, with the one field the metric reads parsed. */
export type BookingsReportRow = {
	date_start: string;
	date_end: string;
	orders_no: number;
};

export type BookingsReport = {
	summary: BookingsReportRow;
	data: BookingsReportRow[];
};

type RawRow = { date_start: string; date_end: string; orders_no: string };
type RawReport = { summary: RawRow; data: RawRow[] };

/** The orders report of a product type, through the WooCommerce Stats proxy. */
const REPORT_PATH =
	'/jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports/orders-by-product-type/by-date';

/** The booking product types, as WooCommerce Bookings sells them. */
const BOOKINGS_FILTERS = [
	{
		key: 'product_type',
		value: [ 'booking', 'bookable-event', 'bookable-service' ],
		compare: 'IN',
	},
];

/**
 * The zone the store reports are bucketed in: the site's own.
 *
 * @return {string} An IANA zone name, or a `±HH:MM` offset for a site set to a UTC offset.
 */
function siteTimeZone(): string {
	const { string: name, offset } = getSettings().timezone;
	if ( name ) {
		return name;
	}

	const hours = Number( offset );
	const sign = hours < 0 ? '-' : '+';
	const totalMinutes = Math.round( Math.abs( hours ) * 60 );
	const hh = String( Math.floor( totalMinutes / 60 ) ).padStart( 2, '0' );
	const mm = String( totalMinutes % 60 ).padStart( 2, '0' );

	return `${ sign }${ hh }:${ mm }`;
}

/**
 * A row with its count as a number and its bounds as the dashboard's time series read them.
 *
 * @param {RawRow} row  - The row as the API returned it.
 * @param {string} zone - The report's zone.
 * @return {BookingsReportRow} The row.
 */
function toRow( row: RawRow, zone: string ): BookingsReportRow {
	const count = parseInt( row.orders_no, 10 );

	return {
		date_start: toBucketStamp( row.date_start, zone ),
		date_end: toBucketStamp( row.date_end, zone ),
		orders_no: isNaN( count ) ? 0 : count,
	};
}

/**
 * The query of one period of the report.
 *
 * @param {ReportParams} params - The period, and the interval and date type of the report.
 * @return {ReportQuery< BookingsReport >} The query.
 */
export function bookingsReportQuery( params: ReportParams ): ReportQuery< BookingsReport > {
	const { from, to, interval, date_type } = params;
	const zone = siteTimeZone();

	return {
		queryKey: [ 'store-performance-bookings', from, to, interval, date_type, zone ],
		queryFn: async () => {
			const report = ( await apiFetch( {
				path: addQueryArgs( REPORT_PATH, {
					from,
					to,
					interval,
					date_type,
					filters: BOOKINGS_FILTERS,
				} ),
			} ) ) as RawReport;

			return {
				summary: toRow( report.summary, zone ),
				data: report.data.map( row => toRow( row, zone ) ),
			};
		},
		enabled: Boolean( from && to && interval ),
		placeholderData: previous => previous,
	};
}

/**
 * The orders report of the booking products, for the selected and the comparison period.
 *
 * @param {ReportParams} params - The dashboard's report params.
 * @return {ReportResult< BookingsReport >} The report.
 */
export function useBookingsReport( params: ReportParams ): ReportResult< BookingsReport > {
	return useReport( bookingsReportQuery, params, {
		disabledComparisonKey: [ 'store-performance-bookings', '__comparison__', 'disabled' ],
	} );
}
