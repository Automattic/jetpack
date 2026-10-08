/**
 * External dependencies
 */
import {
	fetchStatsVideoPlaysRows,
	type ReportParams,
	type StatsReportParams,
	type StatsVideoPlaysComparisonItem,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getReportWindowParams } from './query-params';
import type { ReportCsvExporter } from './types';

/** The Videos report's query: the complete-stats summary of every video in the window. */
export function getVideosReportQueryParams( reportParams: ReportParams ): StatsReportParams {
	return {
		...reportParams,
		max: 0,
		summarize: 1,
		complete_stats: 1,
		...getReportWindowParams( reportParams ),
	};
}

export const videosCsvExporter: ReportCsvExporter<
	StatsVideoPlaysComparisonItem,
	StatsVideoPlaysComparisonItem
> = {
	filenamePrefix: 'videos',
	hasDateRange: true,
	fetchItems: reportParams =>
		fetchStatsVideoPlaysRows( getVideosReportQueryParams( reportParams ) ),
	toCsvRows: items => [ ...items ].sort( ( a, b ) => b.plays - a.plays ),
	getColumns: () => [
		{ label: __( 'Video ID', 'jetpack-premium-analytics-pkg' ), getValue: row => row.id ?? '' },
		{
			label: __( 'Video', 'jetpack-premium-analytics-pkg' ),
			getValue: row =>
				typeof row.label === 'string' && row.label
					? row.label
					: __( 'Untitled video', 'jetpack-premium-analytics-pkg' ),
		},
		{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.plays },
		{
			label: __( 'Impressions', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.impressions,
		},
		{
			label: __( 'Hours watched', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.watch_time,
		},
		{
			label: __( 'Retention rate (%)', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.retention_rate,
		},
		{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
	],
};
