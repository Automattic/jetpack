/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';

/**
 * The two leaderboards the widget toggles between: comment authors and
 * most-commented posts.
 */
export type CommentsView = 'authors' | 'posts';

export type CommentsAttributes = {
	max?: number;
	/**
	 * Leaderboard shown first. Local tab state takes over once the user toggles;
	 * this only seeds the initial view (used by the host and Storybook).
	 */
	initialView?: CommentsView;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Comments" module. Shows two leaderboards behind
 * an Authors/Posts toggle: the most active comment authors and the most commented
 * posts. The Stats comments endpoint is date-range agnostic and has no comparison
 * period, so the widget renders the same regardless of the dashboard date picker.
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
	],
	example: {
		attributes: {
			max: 10,
		},
	},
};
