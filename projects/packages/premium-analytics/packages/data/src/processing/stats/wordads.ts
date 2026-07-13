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

/**
 * Align a normalized WordAds report to `length` buckets by dropping trailing
 * buckets and recomputing the summary over the retained ones.
 *
 * The primary window is clamped to end yesterday (WordAds stats are computed
 * nightly), which drops its trailing bucket, while the comparison window sits in
 * the past and keeps every bucket — so a range ending today yields a comparison
 * one bucket longer than the primary. Trimming the comparison back to the
 * primary's bucket count keeps the two windows equal-length: the
 * period-over-period delta then compares like-sized windows, and the dashed
 * overlay aligns to the primary point-for-point (oldest-first) instead of
 * doubling its last point. The trailing bucket is the one dropped because the
 * surplus is the newest bucket, which has no counterpart in the clamped primary.
 *
 * @param report - The normalized WordAds report.
 * @param length - The bucket count to align to (the primary window's).
 * @return The report unchanged when already at or under `length`, otherwise a
 *         copy trimmed to `length` leading buckets with a recomputed summary.
 */
export function sliceWordAdsStatsReport(
	report: StatsWordAdsResponse,
	length: number
): StatsWordAdsResponse {
	if ( report.data.length <= length ) {
		return report;
	}

	// Narrow to the WordAds point array before slicing: indexing the
	// StatsWordAdsResponse intersection widens `.slice()` back to the base
	// normalized point, dropping the WordAds fields.
	const points: StatsWordAdsDataPoint[] = report.data;
	const data = points.slice( 0, length );

	return { ...report, data, summary: summarizeWordAdsStats( data, report.summary ) };
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
