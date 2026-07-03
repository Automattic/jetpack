/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';

/**
 * Configurable attributes for the Annual highlights widget: one visibility
 * toggle per metric tile. Mirrors the `attributes` declared on the widget
 * definition below; the host renders them as checkboxes and passes the selected
 * values through to `render.tsx`. The widget has no date range — the insights
 * endpoint is not period-scoped.
 */
export type AnnualHighlightsAttributes = {
	showPosts?: boolean;
	showWords?: boolean;
	showLikes?: boolean;
	showComments?: boolean;
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: every
 * metric enabled.
 */
export default {
	name: 'jpa/annual-highlights',
	title: __( 'Annual highlights', 'jetpack-premium-analytics' ),
	icon: calendar,
	attributes: [
		{ id: 'showPosts', label: __( 'Posts', 'jetpack-premium-analytics' ), type: 'boolean' },
		{ id: 'showWords', label: __( 'Words', 'jetpack-premium-analytics' ), type: 'boolean' },
		{ id: 'showLikes', label: __( 'Likes', 'jetpack-premium-analytics' ), type: 'boolean' },
		{ id: 'showComments', label: __( 'Comments', 'jetpack-premium-analytics' ), type: 'boolean' },
	],
	example: {
		attributes: {
			showPosts: true,
			showWords: true,
			showLikes: true,
			showComments: true,
		},
	},
};
