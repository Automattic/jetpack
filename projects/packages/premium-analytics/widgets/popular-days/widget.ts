/**
 * External dependencies
 */
import { calendar } from '@wordpress/icons';

/**
 * Configurable attributes for the Popular days widget. There are none: the
 * metric is fixed and the date range comes from the dashboard picker.
 */
export type PopularDaysAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Shows the busiest day of the week for the selected range, as the weekday name,
 * its mean views, and an area chart of the whole week's distribution.
 */
export default {
	icon: calendar,
};
