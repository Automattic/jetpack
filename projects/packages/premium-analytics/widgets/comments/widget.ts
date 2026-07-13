/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Which of the two Comments views is shown: comment authors or commented posts.
 */
export type CommentsView = 'authors' | 'posts';

export type CommentsAttributes = {
	/**
	 * Maximum number of rows to display.
	 */
	max?: number;
	/**
	 * The view the widget opens on: comment authors or commented posts. Both
	 * views are always available through the in-widget selector; this is only
	 * the initial selection.
	 */
	view?: CommentsView;
};

/**
 * Widget type definition for the Comments widget.
 *
 * Ported from the Jetpack Stats "Comments" module. Ranks the site's comment
 * authors and its most-commented posts and pages by comment count. The active
 * view is the `view` attribute (`relevance: 'high'`), so the widget host renders
 * the "View by" control in the widget header rather than the widget body.
 *
 * Data: fetched via the PA proxy at `stats/comments` through `useStatsComments`.
 * The endpoint is all-time and has no comparison period, so the widget ignores
 * the dashboard date range.
 */
export default {
	name: 'jpa/comments',
	title: __( 'Comments', 'jetpack-premium-analytics' ),
	icon: comment,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
		{
			id: 'view',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{ label: __( 'Authors', 'jetpack-premium-analytics' ), value: 'authors' },
				{ label: __( 'Posts & pages', 'jetpack-premium-analytics' ), value: 'posts' },
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< CommentsAttributes >[],
	example: {
		attributes: {
			max: 10,
			view: 'authors',
		},
	},
};
