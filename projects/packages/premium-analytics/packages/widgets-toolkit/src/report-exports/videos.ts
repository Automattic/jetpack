/**
 * External dependencies
 */
import {
	fetchStatsVideoPlaysSummaryRows,
	type StatsVideoPlaysComparisonItem,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { DatedReportCsvExporter } from './types';

type VideoRow = StatsVideoPlaysComparisonItem;

// The summary query builds its own fixed request, so the report window is all it needs.
export const videosCsvExporter: DatedReportCsvExporter< VideoRow, VideoRow > = {
	filenamePrefix: 'videos',
	hasDateRange: true,
	fetchItems: reportParams => fetchStatsVideoPlaysSummaryRows( reportParams ),
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
		{ label: __( 'Plays', 'jetpack-premium-analytics-pkg' ), getValue: row => row.plays },
		{
			label: __( 'Impressions', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.impressions,
		},
		{
			label: __( 'Watch time (hours)', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.watch_time,
		},
		{
			label: __( 'Retention rate (%)', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.retention_rate,
		},
		{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
	],
};
