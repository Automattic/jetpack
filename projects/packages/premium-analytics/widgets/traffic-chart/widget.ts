/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from Jetpack Stats' `stats-chart-tabs` traffic card (wp-calypso
 * `client/my-sites/stats/stats-chart-tabs`). v1 charts Views and Visitors
 * over the last 30 days; no period editor is exposed yet.
 */
export default {
	name: 'jpa/traffic-chart',
	title: __( 'Traffic', 'jetpack-premium-analytics' ),
	description: __( 'Track your site’s views and visitors over time.', 'jetpack-premium-analytics' ),
	icon: chartBar,
	example: {
		attributes: {
			unit: 'day',
			quantity: 30,
		},
	},
};
