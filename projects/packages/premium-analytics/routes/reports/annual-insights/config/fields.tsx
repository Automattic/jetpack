/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
import type { StatsInsightsYear } from '@jetpack-premium-analytics/data';
import type { Field } from '@jetpack-premium-analytics/externals';

/**
 * Format a numeric Annual insights count for display.
 *
 * @param value - The value to format.
 * @return The formatted number.
 */
function formatNumber( value: number ): string {
	return formatMetricValue( value, 'number', { decimals: 0, useMultipliers: false } );
}

/**
 * Format a per-post average for display. Legacy's `formatTableValue` allowlists
 * `avg_comments` and `avg_likes` for one decimal; images follow them by
 * analogy, legacy having never rendered that column.
 *
 * @param value - The average to format.
 * @return The formatted average.
 */
function formatAverage( value: number ): string {
	return formatMetricValue( value, 'average', { decimals: 1 } );
}

/**
 * DataViews field config for the Annual insights records table. Columns and
 * order follow the legacy "All-time annual insights" table (wp-calypso
 * `annual-site-stats`): Year, Total posts, Total comments, Avg comments per
 * post, Total likes, Avg likes per post, Total words, Avg words per post —
 * then the image counts, which the endpoint has always returned but legacy
 * never rendered.
 *
 * @return The field config.
 */
export function getAnnualInsightsFields(): Field< StatsInsightsYear >[] {
	return [
		{
			id: 'year',
			label: __( 'Year', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.year,
		},
		{
			id: 'total_posts',
			label: __( 'Total posts', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.total_posts,
			render: ( { item } ) => <>{ formatNumber( item.total_posts ) }</>,
		},
		{
			id: 'total_comments',
			label: __( 'Total comments', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.total_comments,
			render: ( { item } ) => <>{ formatNumber( item.total_comments ) }</>,
		},
		{
			id: 'avg_comments',
			label: __( 'Avg comments per post', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.avg_comments,
			render: ( { item } ) => <>{ formatAverage( item.avg_comments ) }</>,
		},
		{
			id: 'total_likes',
			label: __( 'Total likes', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.total_likes,
			render: ( { item } ) => <>{ formatNumber( item.total_likes ) }</>,
		},
		{
			id: 'avg_likes',
			label: __( 'Avg likes per post', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.avg_likes,
			render: ( { item } ) => <>{ formatAverage( item.avg_likes ) }</>,
		},
		{
			id: 'total_words',
			label: __( 'Total words', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.total_words,
			render: ( { item } ) => <>{ formatNumber( item.total_words ) }</>,
		},
		{
			id: 'avg_words',
			label: __( 'Avg words per post', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.avg_words,
			// Legacy renders this one average whole, unlike comments and likes.
			render: ( { item } ) => <>{ formatNumber( item.avg_words ) }</>,
		},
		{
			id: 'total_images',
			label: __( 'Total images', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.total_images,
			render: ( { item } ) => <>{ formatNumber( item.total_images ) }</>,
		},
		{
			id: 'avg_images',
			label: __( 'Avg images per post', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.avg_images,
			render: ( { item } ) => <>{ formatAverage( item.avg_images ) }</>,
		},
	];
}
