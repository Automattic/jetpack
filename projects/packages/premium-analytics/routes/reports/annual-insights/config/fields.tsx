/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsInsightsYear } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * Format a numeric Annual insights count for display.
 *
 * @param value - The value to format.
 * @return The formatted number.
 */
function formatNumber( value: number ): string {
	return value.toLocaleString();
}

/**
 * Format a per-post average for display. Legacy renders averages with one
 * decimal ("0.5", "4.0"), so a whole number keeps its trailing `.0`.
 *
 * @param value - The average to format.
 * @return The formatted average.
 */
function formatAverage( value: number ): string {
	return value.toLocaleString( undefined, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	} );
}

/**
 * DataViews field config for the Annual insights records table. Columns and
 * order mirror the legacy "All-time annual insights" table (wp-calypso
 * `annual-site-stats`): Year, Total posts, Total comments, Avg comments per
 * post, Total likes, Avg likes per post, Total words, Avg words per post.
 *
 * @return The field config.
 */
export function getAnnualInsightsFields(): Field< StatsInsightsYear >[] {
	return [
		{
			id: 'year',
			label: __( 'Year', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.year,
		},
		{
			id: 'total_posts',
			label: __( 'Total posts', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_posts,
			render: ( { item } ) => <>{ formatNumber( item.total_posts ) }</>,
		},
		{
			id: 'total_comments',
			label: __( 'Total comments', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_comments,
			render: ( { item } ) => <>{ formatNumber( item.total_comments ) }</>,
		},
		{
			id: 'avg_comments',
			label: __( 'Avg comments per post', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.avg_comments,
			render: ( { item } ) => <>{ formatAverage( item.avg_comments ) }</>,
		},
		{
			id: 'total_likes',
			label: __( 'Total likes', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_likes,
			render: ( { item } ) => <>{ formatNumber( item.total_likes ) }</>,
		},
		{
			id: 'avg_likes',
			label: __( 'Avg likes per post', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.avg_likes,
			render: ( { item } ) => <>{ formatAverage( item.avg_likes ) }</>,
		},
		{
			id: 'total_words',
			label: __( 'Total words', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_words,
			render: ( { item } ) => <>{ formatNumber( item.total_words ) }</>,
		},
		{
			id: 'avg_words',
			label: __( 'Avg words per post', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.avg_words,
			render: ( { item } ) => <>{ formatAverage( item.avg_words ) }</>,
		},
	];
}
