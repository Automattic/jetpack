/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { commentContent } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type MostCommentedPostsAttributes = {
	/**
	 * Maximum number of rows to display. `0` means all rows.
	 */
	max?: number;
};

/**
 * Widget type definition for the Most commented posts widget.
 *
 * One half of the Jetpack Stats "Comments" module: the posts and pages that
 * receive the most comments. The other half ships as
 * `jpa/most-commented-authors`.
 *
 * Data: fetched via the PA proxy at `stats/comments` through
 * `useStatsCommentsRows`. The endpoint is all-time and has no comparison
 * period, so the widget ignores the dashboard date range.
 */
export default {
	icon: commentContent,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< MostCommentedPostsAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};
