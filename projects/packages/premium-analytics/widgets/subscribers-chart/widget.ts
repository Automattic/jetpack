/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Granularity the chart can be grouped by. `auto` follows the dashboard date
 * range (a wide range buckets by month, a narrow one by day); an explicit
 * value sticks across range changes.
 */
export type SubscribersChartGranularity = 'auto' | 'day' | 'week' | 'month';

/**
 * Configurable attributes for the Subscribers chart widget. Report params
 * still reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 *
 * @property granularity - Bucket size within the dashboard range. Defaults to `auto`.
 */
export type SubscribersChartAttributes = {
	granularity?: SubscribersChartGranularity;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-subscribers-chart-section` card in
 * wp-calypso. The date range and previous-period comparison follow the
 * dashboard picker; the legacy interval segmented control is the
 * `granularity` attribute (`relevance: 'high'`), so the widget host renders
 * its control. It only chooses the bucket size within that range.
 */
export default {
	name: 'jpa/subscribers-chart',
	title: __( 'Subscribers', 'jetpack-premium-analytics' ),
	description: __(
		'Track subscriber growth over time, with paid subscribers and the previous period overlaid for comparison.',
		'jetpack-premium-analytics'
	),
	icon: trendingUp,
	attributes: [
		{
			id: 'granularity',
			label: __( 'Group by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Auto', 'jetpack-premium-analytics' ),
					value: 'auto',
				},
				{
					label: __( 'By days', 'jetpack-premium-analytics' ),
					value: 'day',
				},
				{
					label: __( 'By weeks', 'jetpack-premium-analytics' ),
					value: 'week',
				},
				{
					label: __( 'By months', 'jetpack-premium-analytics' ),
					value: 'month',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< SubscribersChartAttributes >[],
	example: {
		attributes: {
			granularity: 'auto',
		},
	},
};
