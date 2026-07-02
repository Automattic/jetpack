/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. The "most popular day"
 * highlight is a site-wide insight that does not depend on the dashboard date
 * range, so no report params are consumed either.
 */
export type MostPopularDayAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats Insights "most popular day" highlight: the day
 * of the week with the highest share of views, plus that share.
 */
export default {
	name: 'jpa/most-popular-day',
	title: __( 'Most popular day', 'jetpack-premium-analytics' ),
	description: __( 'The day of the week that gets the most views.', 'jetpack-premium-analytics' ),
	icon: calendar,
};
