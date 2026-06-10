/**
 * Internal dependencies
 */
import type { StatsVisitsResponse } from '../../api/report-stats-visits-fetch';

/**
 * A single normalized period. `period`/`date_start` hold the period's start
 * date (YYYY-MM-DD); every other key is a numeric metric (views, visitors, …).
 * `date_start` mirrors the time-series shape the chart builders expect.
 */
export type StatsVisitsItem = {
	period: string;
	date_start: string;
	[ metric: string ]: string | number;
};

export type SanitizedStatsVisits = {
	data: StatsVisitsItem[];
	summary: { date_start: string; date_end: string };
};

/**
 * Zip a raw `data` row against `fields` into a typed period item, coercing
 * metric columns to numbers. Port of Calypso's `parseChartData`
 * (wp-calypso `client/state/stats/lists/utils.js`), metric side only.
 *
 * @param fields - Column names from the response.
 * @param row    - One `data` row, aligned to `fields` by index.
 */
function parseRow( fields: string[], row: Array< string | number | null > ): StatsVisitsItem {
	// Weeks come back as `2024-W26`; the chart wants a plain date.
	const period = String( row[ fields.indexOf( 'period' ) ] ?? '' ).replace( /W/g, '-' );

	const item: StatsVisitsItem = { period, date_start: period };

	fields.forEach( ( field, index ) => {
		if ( field !== 'period' ) {
			item[ field ] = Number( row[ index ] ?? 0 );
		}
	} );

	return item;
}

/**
 * Normalize the `/stats/visits` response into time-series period items.
 *
 * @param response - Raw visits response.
 */
export function sanitizeReportStatsVisitsResponse(
	response: StatsVisitsResponse
): SanitizedStatsVisits {
	const fields = response?.fields ?? [];
	const data = ( response?.data ?? [] ).map( row => parseRow( fields, row ) );

	return {
		data,
		summary: {
			date_start: data[ 0 ]?.date_start ?? '',
			date_end: data[ data.length - 1 ]?.date_start ?? '',
		},
	};
}
