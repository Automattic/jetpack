/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. Report params still reach it
 * through WidgetRoot: the dashboard date range, or `attributes.reportParams`
 * when a host injects them (e.g. Storybook and dashboard previews).
 */
export type SubscribersChartAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-subscribers-chart-section` card in
 * wp-calypso. The date range and previous-period comparison follow the
 * dashboard picker; the legacy interval segmented control becomes the in-body
 * "Group by" dropdown, which only chooses the bucket size within that range.
 */
export default {
	name: 'jpa/subscribers-chart',
	title: __( 'Subscribers', 'jetpack-premium-analytics' ),
	description: __(
		'Track subscriber growth over time, with paid subscribers and the previous period overlaid for comparison.',
		'jetpack-premium-analytics'
	),
	icon: trendingUp,
};
