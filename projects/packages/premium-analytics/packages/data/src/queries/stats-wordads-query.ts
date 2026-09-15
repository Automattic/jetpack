/**
 * External dependencies
 */
import { getDatePart, localTZDate } from '@jetpack-premium-analytics/datetime';
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
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
	// The endpoint honors an end of today; that bucket stays empty until the nightly run.
	const today = format( localTZDate(), 'yyyy-MM-dd' );
	// Compare date parts, not the raw strings: a datetime sorts after the bare day
	// it starts with, so a window ending exactly on today would clamp too.
	const rangeEndDay = getDatePart( rangeEnd );
	const clampToToday = rangeEndDay !== undefined && rangeEndDay > today;
	const date = clampToToday ? today : rangeEnd;
	// The endpoint takes a bucket count and end date, not a range.
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
