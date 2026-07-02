/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. It shows a single lifetime
 * figure, so it has no date range or comparison period either — report params
 * from WidgetRoot are ignored.
 */
export type AllTimeViewsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "All-time views" card. Displays the total number
 * of views the site has received over its entire lifetime; the value comes from
 * the site stats summary and is not scoped to the dashboard date range.
 */
export default {
	name: 'jpa/all-time-views',
	title: __( 'All-time views', 'jetpack-premium-analytics' ),
	description: __(
		'The total number of views your site has received since it started.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
};
