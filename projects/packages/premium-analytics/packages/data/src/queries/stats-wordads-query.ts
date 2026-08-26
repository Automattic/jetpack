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
	// WordAds stats are computed nightly, so clamp later end dates to yesterday.
	// Compare date parts because `rangeEnd` may include a time and offset.
	const rangeEndDay = getDatePart( rangeEnd );
	const yesterday = format( subDays( localTZDate(), 1 ), 'yyyy-MM-dd' );
	const clampToYesterday = rangeEndDay !== undefined && rangeEndDay > yesterday;
	const date = clampToYesterday ? yesterday : rangeEnd;
	// The endpoint accepts a bucket count and end date, not a range. Use the
	// clamped end to drop today's unavailable bucket without shifting the start.
	// Preserve Calypso's defaults when no range is supplied. Comparison consumers
	// must align bucket counts because past ranges are not clamped.
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
