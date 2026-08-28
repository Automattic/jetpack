/**
 * WordPress dependencies
 */
import { scheduled } from '@wordpress/icons';

/**
 * Configurable attributes for the Most popular time widget. The widget has no
 * user-configurable settings — the highlights come straight from the insights
 * endpoint, which reports over a fixed server-side window and takes no date
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
	icon: scheduled,
};
