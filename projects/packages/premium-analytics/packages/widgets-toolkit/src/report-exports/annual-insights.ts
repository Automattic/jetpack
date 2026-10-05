/**
 * External dependencies
 */
import { fetchStatsInsightsYears, type StatsInsightsYear } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { ReportCsvExporter } from './types';

export const annualInsightsCsvExporter: ReportCsvExporter< StatsInsightsYear, StatsInsightsYear > =
	{
		filenamePrefix: 'annual-insights',
		hasDateRange: false,
		fetchItems: () => fetchStatsInsightsYears(),
		toCsvRows: items => [ ...items ].sort( ( a, b ) => Number( b.year ) - Number( a.year ) ),
		getColumns: () => [
			{ label: __( 'Year', 'jetpack-premium-analytics-pkg' ), getValue: row => row.year },
			{
				label: __( 'Total posts', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_posts,
			},
			{
				label: __( 'Total comments', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_comments,
			},
			{
				label: __( 'Avg comments per post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.avg_comments,
			},
			{
				label: __( 'Total likes', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_likes,
			},
			{
				label: __( 'Avg likes per post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.avg_likes,
			},
			{
				label: __( 'Total words', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_words,
			},
			{
				label: __( 'Avg words per post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.avg_words,
			},
			{
				label: __( 'Total images', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.total_images,
			},
			{
				label: __( 'Avg images per post', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.avg_images,
			},
		],
	};
