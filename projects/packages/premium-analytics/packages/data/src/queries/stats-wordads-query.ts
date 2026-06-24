/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsTimeSeriesReport } from '../processing/stats';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsWordAdsStatsResponse = StatsTimeSeriesReport;

export type StatsWordAdsEarningsPeriod = {
	amount: number | string;
	pageviews: number | string;
	status: number;
};

export type StatsWordAdsEarningsBreakdown = Record< string, StatsWordAdsEarningsPeriod >;

export type StatsWordAdsEarnings = {
	total_earnings?: number | string;
	total_amount_owed?: number | string;
	wordads?: StatsWordAdsEarningsBreakdown;
	sponsored?: StatsWordAdsEarningsBreakdown;
	adjustment?: StatsWordAdsEarningsBreakdown;
};

export type StatsWordAdsEarningsResponse = {
	earnings: StatsWordAdsEarnings;
};

export const statsWordAdsStatsQuery = (
	params: StatsQueryParams = {}
): StatsReportQueryOptions< 'timeSeries' > =>
	statsProxyQuery( {
		name: 'wordads-stats',
		version: '1.1',
		endpoint: 'wordads/stats',
		params,
		sanitizer: 'timeSeries',
	} );

export const statsWordAdsEarningsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'wordads-earnings',
		version: '1.1',
		endpoint: 'wordads/earnings',
		params,
	} );
