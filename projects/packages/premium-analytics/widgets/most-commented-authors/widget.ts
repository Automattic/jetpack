/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { commentAuthorAvatar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type MostCommentedAuthorsAttributes = {
	/**
	 * Maximum number of rows to display. `0` means all rows.
	 */
	max?: number;
};

/**
 * Widget type definition for the Most commented authors widget.
 *
 * One half of the Jetpack Stats "Comments" module: the site's most active
 * commenters, ranked by comment count. The other half ships as
 * `jpa/most-commented-posts`.
 *
 * Data: fetched via the PA proxy at `stats/comments` through
 * `useStatsCommentsRows`. The endpoint is all-time and has no comparison
 * period, so the widget ignores the dashboard date range.
 */
export default {
	icon: commentAuthorAvatar,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< MostCommentedAuthorsAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};
