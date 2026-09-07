/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	chartTypeAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * How the selected metric is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
 */
export type SubscribersChartType = ChartDisplayChartType;

/**
 * The metric tabs the chart shows, in display order: the id and label of each
 * metric. The Paid subscribers tab only renders when the site has paid
 * subscribers.
 */
export const SUBSCRIBERS_CHART_METRICS = [
	{ id: 'subscribers', label: __( 'Subscribers', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'paid', label: __( 'Paid subscribers', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier of one metric tab.
 */
export type SubscribersChartMetricId = ( typeof SUBSCRIBERS_CHART_METRICS )[ number ][ 'id' ];

/**
 * @property chartType - How to draw the selected metric. Defaults to `line`.
 */
export type SubscribersChartAttributes = {
	chartType?: SubscribersChartType;
};

/**
 * Ported from the Jetpack Stats `stats-subscribers-chart-section` card; the
 * legacy interval control is now the dashboard's chart interval control.
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	icon: people,
	attributes: [ chartTypeAttributeField() ] as WidgetAttributeField< SubscribersChartAttributes >[],
	example: {
		attributes: {
			chartType: 'line',
		},
	},
};
