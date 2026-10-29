/**
 * External dependencies
 */
import { toBucketStamp, useReport } from '@automattic/jetpack-premium-analytics-sdk';
import apiFetch from '@wordpress/api-fetch';
import { getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
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
 * Shape-checked, not `instanceof`: a `Response` from another realm fails that check.
 *
 * @param {unknown} value - The value apiFetch resolved or threw.
 * @return {boolean} Whether it is a `Response`.
 */
function isResponse( value: unknown ): value is Response {
	return (
		typeof value === 'object' &&
		value !== null &&
		'status' in value &&
		typeof value.status === 'number' &&
		'json' in value &&
		typeof value.json === 'function'
	);
}

/**
 * Whether an error body is a plain object a status can be attached to.
 *
 * @param {unknown} body - The parsed error body.
 * @return {boolean} Whether it is a plain object.
 */
function isPlainErrorBody( body: unknown ): body is Record< string, unknown > {
	return typeof body === 'object' && body !== null && ! Array.isArray( body );
}

/**
 * Parse a response body as JSON, throwing apiFetch's `invalid_json` shape on failure.
 *
 * @param {Response} response - The response to parse.
 * @return {Promise< unknown >} The parsed body.
 */
async function parseJson( response: Response ): Promise< unknown > {
	try {
		return await response.json();
	} catch {
		// The shape apiFetch throws for the same failure.
		throw {
			code: 'invalid_json',
			message: __( 'The response is not a valid JSON response.', 'jetpack-woocommerce-stats-pkg' ),
		};
	}
}

/**
 * Turn a failed `Response` into the error to throw, with its HTTP status attached.
 *
 * WordPress.com errors pass through shaped `{ error, message }`, with no status in the
 * body, and the dashboard's retry and error handling read the status.
 *
 * @param {Response} response - The failed response.
 * @return {Promise< unknown >} The error value to throw.
 */
async function toError( response: Response ): Promise< unknown > {
	let body: unknown;
	try {
		body = await parseJson( response );
	} catch ( parseError ) {
		body = parseError;
	}

	return isPlainErrorBody( body ) && ! ( 'status' in body )
		? { ...body, status: response.status }
		: body;
}

/**
 * Request through apiFetch without its parse step, so a failure keeps its HTTP status.
 *
 * @param {string} path - REST path of the request, query string included.
 * @return {Promise< TResponse >} The parsed response body.
 */
async function fetchPreservingStatus< TResponse >( path: string ): Promise< TResponse > {
	let result: unknown;

	try {
		result = await apiFetch( { path, parse: false } );
	} catch ( thrown ) {
		// A network error or an abort has no status to add.
		if ( ! isResponse( thrown ) ) {
			throw thrown;
		}

		const error = await toError( thrown );

		// apiFetch only refreshes a stale nonce when it parses the response itself.
		if ( isPlainErrorBody( error ) && error.code === 'rest_cookie_invalid_nonce' ) {
			return ( await apiFetch( { path } ) ) as TResponse;
		}

		throw error;
	}

	// A middleware that resolves plain data, as a mock does, has already parsed it.
	if ( ! isResponse( result ) ) {
		return result as TResponse;
	}

	return ( result.status === 204 ? null : await parseJson( result ) ) as TResponse;
}

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
			const report = await fetchPreservingStatus< RawReport >(
				addQueryArgs( REPORT_PATH, {
					from,
					to,
					interval,
					date_type,
					filters: BOOKINGS_FILTERS,
				} )
			);

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
