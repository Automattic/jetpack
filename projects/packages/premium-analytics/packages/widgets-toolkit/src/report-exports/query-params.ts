/**
 * External dependencies
 */
import type { ReportParams, StatsReportParams } from '@jetpack-premium-analytics/data';

/** The detailed-report request: every row, summarized over the selected days. */
export function getSummarizedReportQueryParams( reportParams: ReportParams ): StatsReportParams {
	return { ...reportParams, max: 0, summarize: 1, period: 'day' };
}
