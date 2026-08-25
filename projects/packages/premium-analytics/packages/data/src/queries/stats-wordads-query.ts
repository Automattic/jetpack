/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { format, subDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { localTZDate } from '../utils/date';
import {
	getPeriodsBetweenInclusive,
	reportParamsToStatsQueryParams,
	statsQueryParamsToApiParams,
	type StatsPeriod,
} from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsWordAdsEarningsResponse, StatsWordAdsResponse } from '../processing/stats';

export type StatsWordAdsParams = StatsReportParams & {
	quantity?: number;
};

export type StatsWordAdsEarningsParams = Record< string, never >;

export const statsWordAdsStatsQuery = (
	params: StatsWordAdsParams
): StatsReportQueryOptions< 'wordAdsStats' > => {
	const statsParams = reportParamsToStatsQueryParams( params );
	const apiParams = statsQueryParamsToApiParams( statsParams );
	const unit = String( apiParams.period ?? 'day' );
	const { start_date: startDate } = statsParams;
	const rangeEnd = typeof apiParams.date === 'string' ? apiParams.date : undefined;
	// WordAds stats are computed nightly for the previous day (the Calypso
	// WordAds page never shows the current day), so a window ending today would
	// close on an empty bucket — clamp the window end to yesterday. Compare
	// calendar days: `rangeEnd` may carry a time and offset, and a datetime sorts
	// after the bare day it starts with, so the raw strings would clamp a window
	// that ends exactly on yesterday.
	const rangeEndDay = getDatePart( rangeEnd );
	const yesterday = format( subDays( localTZDate(), 1 ), 'yyyy-MM-dd' );
	const clampToYesterday = rangeEndDay !== undefined && rangeEndDay > yesterday;
	const date = clampToYesterday ? yesterday : rangeEnd;
	// The endpoint is quantity-based (`unit` buckets ending at `date`), not
	// `from`/`to`-based, so the dashboard range is translated here: the number of
	// buckets spanning the range becomes `quantity`. Derive it from the clamped
	// `date` (not the raw range end) so a window clamped to yesterday stays
	// anchored to the range start — dropping the unavailable trailing bucket
	// rather than shifting a bucket earlier and overlapping the dashboard's
	// comparison window. The Calypso defaults remain the range-less fallback.
	//
	// A comparison query paired with this primary query will sit wholly in the
	// past (no clamping), so it keeps all its buckets. If the primary range ends
	// today, its comparison ends yesterday — and the comparison will have one
	// more bucket than the primary. Any consumer pairing them must account for
	// this bucket-count mismatch.
	const defaultQuantity = unit === 'year' ? 10 : 30;
	const quantity =
		params.quantity ??
		( startDate && date
			? getPeriodsBetweenInclusive( unit as StatsPeriod, startDate, date )
			: defaultQuantity );
	const wordAdsParams: StatsProxyParams = {
		unit,
		...( date ? { date } : {} ),
		quantity,
	};

	return statsProxyQuery( {
		name: 'wordads-stats',
		version: '1.1',
		endpoint: 'wordads/stats',
		params: wordAdsParams,
		sanitizer: 'wordAdsStats',
		sanitizerParams: {
			period: unit,
			...( date ? { date } : {} ),
		},
		enabled: !! date,
	} );
};

export const statsWordAdsEarningsQuery = (
	params: StatsWordAdsEarningsParams = {}
): StatsReportQueryOptions< 'wordAdsEarnings' > =>
	statsProxyQuery( {
		name: 'wordads-earnings',
		version: '1.1',
		endpoint: 'wordads/earnings',
		params,
		sanitizer: 'wordAdsEarnings',
	} );

export type { StatsWordAdsEarningsResponse, StatsWordAdsResponse };
