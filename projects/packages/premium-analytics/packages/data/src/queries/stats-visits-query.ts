/**
 * Internal dependencies
 */
import {
	getPeriodsBetweenInclusive,
	reportParamsToStatsQueryParams,
	statsQueryParamsToApiParams,
} from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsTimeSeriesReport } from '../processing/stats';
import type { StatsPeriod } from '../utils/stats-params';

export type StatsVisitsStatField = 'views' | 'visitors' | 'likes' | 'comments' | 'post_titles';

export type StatsVisitsStatFields =
	| StatsVisitsStatField
	| `${ StatsVisitsStatField },${ StatsVisitsStatField }`
	| `${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField }`
	| `${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField }`
	| `${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField }`;

export type StatsVisitsParams = StatsReportParams & {
	stat_fields?: StatsVisitsStatFields;
};

export type StatsVisitsResponse = StatsTimeSeriesReport;

type StatsQueryParams = ReturnType< typeof reportParamsToStatsQueryParams >;
// The units this endpoint accepts a bucket count for.
const UNITS_TAKING_QUANTITY = [ 'hour', 'day' ] as const satisfies readonly StatsPeriod[];

function takesQuantity(
	period: StatsPeriod | string | undefined
): period is ( typeof UNITS_TAKING_QUANTITY )[ number ] {
	return ( UNITS_TAKING_QUANTITY as readonly string[] ).includes( period ?? '' );
}

/**
 * How many buckets to ask for: the number of `unit` buckets the range spans.
 * Left off for a unit that does not take one, and for a range missing an end —
 * the endpoint then falls back to its own default window, which need not cover
 * the range the dashboard asked about.
 *
 * @param statsParams - The range and the unit, before they are shaped for the API.
 * @return The bucket count, or `undefined` when one does not apply.
 */
function bucketQuantity( statsParams: StatsQueryParams ): number | undefined {
	const { period, start_date: startDate, end_date: endDate } = statsParams;

	return takesQuantity( period ) && startDate && endDate
		? getPeriodsBetweenInclusive( period, startDate, endDate )
		: undefined;
}

export const statsVisitsQuery = (
	params: StatsVisitsParams
): StatsReportQueryOptions< 'visits' > => {
	const statsParams = reportParamsToStatsQueryParams( params );
	const apiParams = statsQueryParamsToApiParams( statsParams );
	const quantity = bucketQuantity( statsParams );
	const visitsParams: StatsProxyParams = {
		unit: apiParams.period,
		date: apiParams.date,
		start_date: apiParams.start_date,
		...( quantity ? { quantity } : {} ),
		stat_fields: params.stat_fields ?? 'views,visitors',
	};

	return statsProxyQuery( {
		name: 'visits',
		version: '1.1',
		endpoint: 'stats/visits',
		params: visitsParams,
		sanitizer: 'visits',
		enabled: !! ( visitsParams.date || visitsParams.start_date ),
	} );
};
