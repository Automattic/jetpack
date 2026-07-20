/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. The "most popular day"
 * highlight is a site-wide summary that does not depend on the dashboard date
 * range, so no report params are consumed either.
 */
export type MostPopularDayAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats all-time highlight: the single day your site
 * drew the most views, with that day's view count and its share of all views.
 */
export default {
	name: 'jpa/most-popular-day',
	title: __( 'Most popular day', 'jetpack-premium-analytics' ),
	help: {
		content: __( 'The day your site received the most views.', 'jetpack-premium-analytics' ),
	},
	icon: calendar,
};
