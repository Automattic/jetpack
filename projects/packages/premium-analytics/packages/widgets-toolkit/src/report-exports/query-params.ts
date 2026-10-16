/**
 * External dependencies
 */
import { PRESET_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import type { ReportParams, StatsReportParams } from '@jetpack-premium-analytics/data';

/**
 * The window params a report adds for all time: `num: -1`, so WPCOM starts from the site's Stats
 * history, merged blogs included, instead of the placeholder `from` the menu writes.
 *
 * @param reportParams - The report's params.
 * @return `num: -1` on all time, else nothing.
 */
export function getReportWindowParams(
	reportParams: ReportParams
): Pick< StatsReportParams, 'num' > {
	return reportParams.preset === PRESET_ALL_TIME ? { num: -1 } : {};
}

/** The detailed-report request: every row, summarized over the selected days. */
export function getSummarizedReportQueryParams( reportParams: ReportParams ): StatsReportParams {
	return {
		...reportParams,
		max: 0,
		summarize: 1,
		period: 'day',
		...getReportWindowParams( reportParams ),
	};
}
