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
	// start_date/date may now carry the full offset-bearing ISO datetime (see
	// reportParamsToStatsQueryParams); the clamp comparison and bucket count
	// below need the calendar-day part regardless of what's sent to the API.
	const rangeEndDay = getDatePart( rangeEnd ) ?? rangeEnd;
	// WordAds stats are computed nightly for the previous day (the Calypso
	// WordAds page never shows the current day), so a window ending today would
	// close on an empty bucket — clamp the window end to yesterday.
	//
	// The clamped end stays a bare `yyyy-MM-dd` while the unclamped path sends
	// the offset-bearing datetime through. That asymmetry is deliberate: the
	// offset exists to pin down which local day a *time* belongs to, and this
	// value is already resolved to a site-local calendar day by localTZDate().
	// There is nothing left for the server to mis-truncate, so re-stamping it
	// with an offset would add exposure without adding meaning.
	const yesterday = format( subDays( localTZDate(), 1 ), 'yyyy-MM-dd' );
	const clampToYesterday = rangeEndDay !== undefined && rangeEndDay > yesterday;
	const date = clampToYesterday ? yesterday : rangeEnd;
	const dateDay = clampToYesterday ? yesterday : rangeEndDay;
	// The endpoint is quantity-based (`unit` buckets ending at `date`), not
	// `from`/`to`-based, so the dashboard range is translated here: the number of
	// buckets spanning the range becomes `quantity`. Derive it from the clamped
	// `date` (not the raw range end) so a window clamped to yesterday stays
	// anchored to the range start — dropping the unavailable trailing bucket
	// rather than shifting a bucket earlier and overlapping the dashboard's
	// comparison window. The Calypso defaults remain the range-less fallback.
	const defaultQuantity = unit === 'year' ? 10 : 30;
	const quantity =
		params.quantity ??
		( startDate && dateDay
			? getPeriodsBetweenInclusive( unit as StatsPeriod, startDate, dateDay )
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
