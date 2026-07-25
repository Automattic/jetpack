/**
 * Internal dependencies
 */
import { getPeriodsBetweenInclusive, reportParamsToStatsQueryParams } from '../utils/stats-params';
import { statsProxyQuery } from './stats-query';
import type { StatsReportParams, StatsReportQueryOptions } from './stats-query';
import type { StatsPeriod } from '../utils/stats-params';

export const statsSubscribersDefaultStatFields = 'subscribers,subscribers_paid';

/**
 * Granularities the `stats/subscribers` endpoint supports as its `unit`. The
 * dashboard's finer/coarser intervals (`hour`, `quarter`) have no subscriber
 * bucket, so they collapse onto these.
 */
export type StatsSubscribersUnit = 'day' | 'week' | 'month' | 'year';

export type StatsSubscribersParams = {
	unit: StatsPeriod | string;
	quantity: number;
	date: string;
	stat_fields?: string;
};

/**
 * Map a stats `period` onto a granularity the subscribers endpoint accepts.
 *
 * @param period - The period derived from the dashboard interval.
 * @return The nearest supported subscribers unit.
 */
function toSubscribersUnit( period?: string ): StatsSubscribersUnit {
	return period === 'week' || period === 'month' || period === 'year' ? period : 'day';
}

export type StatsSubscribersCountsParams = Record< string, never >;

export const statsSubscribersQuery = (
	params: StatsSubscribersParams
): StatsReportQueryOptions< 'subscribers' > =>
	statsProxyQuery( {
		name: 'subscribers',
		version: '1.1',
		endpoint: 'stats/subscribers',
		params: {
			unit: params.unit,
			quantity: params.quantity,
			// Omit an empty date so a range-less (disabled) query never sends `date=`.
			...( params.date ? { date: params.date } : {} ),
			stat_fields: params.stat_fields ?? statsSubscribersDefaultStatFields,
		},
		sanitizer: 'subscribers',
	} );

/**
 * Build the subscribers time-series query from dashboard report params.
 *
 * The `stats/subscribers` endpoint is quantity-based (`unit` + `quantity` ending
 * at `date`), not `from`/`to`-based, so the dashboard range is translated here:
 * the interval picks the `unit`, the range end becomes `date`, and the number of
 * buckets spanning the range becomes `quantity`. Wrapped in `useStatsReport`,
 * the comparison window is fetched automatically from the dashboard's compare
 * range.
 *
 * @param params - The dashboard report params.
 * @return The subscribers query options.
 */
export const statsSubscribersReportQuery = (
	params: StatsReportParams
): StatsReportQueryOptions< 'subscribers' > => {
	const {
		period,
		start_date: startDate,
		end_date: endDate,
	} = reportParamsToStatsQueryParams( params );
	const unit = toSubscribersUnit( period );
	const quantity =
		startDate && endDate ? getPeriodsBetweenInclusive( unit, startDate, endDate ) : 1;

	// Reuse the endpoint config; only gate on a resolved range end.
	return {
		...statsSubscribersQuery( { unit, quantity, date: endDate ?? '' } ),
		enabled: !! endDate,
	};
};

export const statsSubscribersCountsQuery = (
	params: StatsSubscribersCountsParams = {}
): StatsReportQueryOptions< 'subscribersCounts' > =>
	statsProxyQuery( {
		name: 'subscribers-counts',
		version: '2',
		endpoint: 'subscribers/counts',
		params,
		sanitizer: 'subscribersCounts',
	} );
