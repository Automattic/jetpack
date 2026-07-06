/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { scheduled } from '@wordpress/icons';

/**
 * Configurable attributes for the Most popular time widget. The widget has no
 * user-configurable settings — the highlights come straight from the insights
 * endpoint, which reports across the whole lifetime of the site with no date
 * range or comparison period.
 */
export type MostPopularTimeAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Most popular time" highlight. Shows the day of
 * week and hour of day that draw the most views, each with its share of the
 * total.
 */
export default {
	name: 'jpa/most-popular-time',
	title: __( 'Most popular time', 'jetpack-premium-analytics' ),
	icon: scheduled,
};
