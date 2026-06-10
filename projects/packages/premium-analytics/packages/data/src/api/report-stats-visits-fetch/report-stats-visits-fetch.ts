/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getStatsApiPath } from '../constants';

export type StatsVisitsUnit = 'day' | 'week' | 'month' | 'year';

export type StatsVisitsField = 'views' | 'visitors' | 'likes' | 'comments';

/**
 * Raw WPCOM `/stats/visits` response: `fields` names each column and every
 * `data` row carries those columns in the same order (the first is `period`).
 */
export type StatsVisitsResponse = {
	date: string;
	unit: StatsVisitsUnit;
	fields: string[];
	data: Array< Array< string | number | null > >;
};

export type RequestReportStatsVisitsParams = {
	unit: StatsVisitsUnit;
	/**
	 * Number of periods to include, counting back from `date`.
	 */
	quantity: number;
	/**
	 * Reference date within the period, YYYY-MM-DD. Defaults server-side to today.
	 */
	date?: string;
	statFields: StatsVisitsField[];
};

/**
 * Fetch visit counts (views, visitors, …) over time via the Jetpack Stats
 * proxy (`jetpack/v4/stats-app`, provided by the jetpack-stats-admin package).
 *
 * @param params            - Request parameters.
 * @param params.unit       - Period granularity.
 * @param params.quantity   - Number of periods to include.
 * @param params.date       - Reference date within the period, YYYY-MM-DD.
 * @param params.statFields - Metric fields to request.
 */
export async function fetchReportStatsVisits( {
	unit,
	quantity,
	date,
	statFields,
}: RequestReportStatsVisitsParams ): Promise< StatsVisitsResponse > {
	const path = addQueryArgs( `${ getStatsApiPath() }/visits`, {
		unit,
		quantity,
		stat_fields: statFields.join( ',' ),
		...( date ? { date } : {} ),
	} );

	return apiFetch( { path } ) as Promise< StatsVisitsResponse >;
}
