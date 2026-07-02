/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { scheduled } from '@wordpress/icons';

/**
 * Configurable attributes for the Most popular time widget. The widget has no
 * user-configurable settings — the highlight and hourly distribution come
 * straight from the insights endpoint, which reports across the whole lifetime
 * of the site with no date range or comparison period.
 */
export type MostPopularTimeAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Most popular time" highlight. Shows the hour of
 * day that draws the most views and its share of the total, with a bar chart of
 * views across the day.
 */
export default {
	name: 'jpa/most-popular-time',
	title: __( 'Most popular time', 'jetpack-premium-analytics' ),
	icon: scheduled,
};
