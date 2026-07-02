/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';

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
