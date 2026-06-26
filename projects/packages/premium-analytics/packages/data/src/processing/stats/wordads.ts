import { safeParseFloat } from '../../utils/parsing';
import { sanitizeStatsTimeSeriesResponse, type StatsTimeSeriesDataPoint } from './time-series';
import { coerceStatsRecord } from './utils';
import type { StatsNormalizedReport, StatsNormalizedSummary, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsWordAdsRawField = 'period' | 'impressions' | 'revenue' | 'cpm';

export type StatsWordAdsRawResponse = {
	unit?: string;
	fields?: StatsWordAdsRawField[];
	data?: Array< Array< string | number | null > >;
};

export type StatsWordAdsDataPoint = StatsTimeSeriesDataPoint & {
	impressions?: number;
	revenue?: number;
	cpm?: number;
};

export type StatsWordAdsResponse = StatsNormalizedReport & {
	data: StatsWordAdsDataPoint[];
};

export type StatsWordAdsEarningsRawPeriod = {
	amount?: number | string | null;
	pageviews?: number | string | null;
	status?: number | string | null;
};

export type StatsWordAdsEarningsRawBreakdown = Record< string, StatsWordAdsEarningsRawPeriod >;

export type StatsWordAdsEarningsRaw = {
	total_earnings?: number | string | null;
	total_amount_owed?: number | string | null;
	wordads?: StatsWordAdsEarningsRawBreakdown;
	sponsored?: StatsWordAdsEarningsRawBreakdown;
	adjustment?: StatsWordAdsEarningsRawBreakdown;
};

export type StatsWordAdsEarningsRawResponse = {
	earnings?: StatsWordAdsEarningsRaw;
};

export type StatsWordAdsEarningsPeriod = {
	amount: number;
	pageviews: number;
	status: number;
};

export type StatsWordAdsEarningsBreakdown = Record< string, StatsWordAdsEarningsPeriod >;

export type StatsWordAdsEarnings = {
	total_earnings: number;
	total_amount_owed: number;
	wordads: StatsWordAdsEarningsBreakdown;
	sponsored: StatsWordAdsEarningsBreakdown;
	adjustment: StatsWordAdsEarningsBreakdown;
};

export type StatsWordAdsEarningsResponse = StatsWordAdsEarnings;

const earningsBreakdownKeys = [ 'wordads', 'sponsored', 'adjustment' ] as const;

function summarizeWordAdsStats(
	data: StatsWordAdsDataPoint[],
	baseSummary: StatsNormalizedSummary
): StatsNormalizedSummary {
	if ( ! data.length ) {
		return baseSummary;
	}

	const totals = data.reduce(
		( summary, row ) => ( {
			impressions: summary.impressions + safeParseFloat( row.impressions ),
			revenue: summary.revenue + safeParseFloat( row.revenue ),
		} ),
		{ impressions: 0, revenue: 0 }
	);

	return {
		...baseSummary,
		impressions: totals.impressions,
		revenue: totals.revenue,
		cpm: totals.impressions ? ( totals.revenue / totals.impressions ) * 1000 : 0,
	};
}

function normalizeEarningsPeriod( value: StatsRecord ): StatsWordAdsEarningsPeriod {
	return {
		amount: safeParseFloat( value.amount ),
		pageviews: safeParseFloat( value.pageviews ),
		status: safeParseFloat( value.status ),
	};
}

function normalizeEarningsBreakdown( value: unknown ): StatsWordAdsEarningsBreakdown {
	return Object.fromEntries(
		Object.entries( coerceStatsRecord( value ) ).map( ( [ period, item ] ) => [
			period,
			normalizeEarningsPeriod( coerceStatsRecord( item ) ),
		] )
	);
}

export function sanitizeStatsWordAdsStatsResponse(
	response: StatsWordAdsRawResponse,
	query?: StatsQueryParams
): StatsWordAdsResponse;
export function sanitizeStatsWordAdsStatsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsWordAdsResponse {
	const report = sanitizeStatsTimeSeriesResponse( response, query ) as StatsWordAdsResponse;

	return {
		...report,
		summary: summarizeWordAdsStats( report.data, report.summary ),
	};
}

export function sanitizeStatsWordAdsEarningsResponse(
	response: StatsWordAdsEarningsRawResponse
): StatsWordAdsEarningsResponse;
export function sanitizeStatsWordAdsEarningsResponse(
	response: unknown
): StatsWordAdsEarningsResponse {
	const earnings = coerceStatsRecord( coerceStatsRecord( response ).earnings );

	return {
		total_earnings: safeParseFloat( earnings.total_earnings ),
		total_amount_owed: safeParseFloat( earnings.total_amount_owed ),
		...Object.fromEntries(
			earningsBreakdownKeys.map( key => [ key, normalizeEarningsBreakdown( earnings[ key ] ) ] )
		),
	} as StatsWordAdsEarningsResponse;
}
