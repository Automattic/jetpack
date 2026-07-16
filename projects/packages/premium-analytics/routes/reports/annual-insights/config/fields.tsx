/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsInsightsYear } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * Format a numeric Annual insights value for display.
 *
 * @param value - The value to format.
 * @return The formatted number.
 */
function formatNumber( value: number ): string {
	return value.toLocaleString();
}

/**
 * DataViews field config for the Annual insights records table.
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
			id: 'posts',
			label: __( 'Posts', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_posts,
			render: ( { item } ) => <>{ formatNumber( item.total_posts ) }</>,
		},
		{
			id: 'words',
			label: __( 'Words', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_words,
			render: ( { item } ) => <>{ formatNumber( item.total_words ) }</>,
		},
		{
			id: 'likes',
			label: __( 'Likes', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_likes,
			render: ( { item } ) => <>{ formatNumber( item.total_likes ) }</>,
		},
		{
			id: 'comments',
			label: __( 'Comments', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.total_comments,
			render: ( { item } ) => <>{ formatNumber( item.total_comments ) }</>,
		},
	];
}
