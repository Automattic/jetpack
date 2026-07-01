/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';

/**
 * The widget exposes no configurable attributes: granularity is in-body local
 * state and the date window is derived, not host-provided.
 */
export type SubscribersChartAttributes = Record< string, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-subscribers-chart-section` card in
 * wp-calypso. The legacy interval segmented control becomes the in-body
 * "Group by" dropdown; granularity is local UI state rather than a persisted
 * attribute, so the widget declares no attributes.
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
