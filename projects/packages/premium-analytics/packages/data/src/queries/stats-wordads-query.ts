/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams, statsQueryParamsToApiParams } from '../utils/stats-params';
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
	const date = typeof apiParams.date === 'string' ? apiParams.date : undefined;
	const wordAdsParams: StatsProxyParams = {
		unit,
		...( date ? { date } : {} ),
		quantity: params.quantity ?? ( unit === 'year' ? 10 : 30 ),
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
