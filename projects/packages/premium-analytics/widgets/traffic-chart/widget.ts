/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-chart-tabs` card in wp-calypso (the chart
 * above the Traffic page). Renders the selected period's Views, Visitors, Likes,
 * and Comments as selectable metric tabs over a comparative line chart. It exposes
 * no configurable attributes — the date range and comparison state come from the
 * dashboard via `reportParams`, not persisted attributes.
 */
export default {
	name: 'jpa/traffic-chart',
	title: __( 'Traffic', 'jetpack-premium-analytics' ),
	description: __(
		'Compare views, visitors, likes, and comments over the selected period, with the previous period overlaid for comparison.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
};
