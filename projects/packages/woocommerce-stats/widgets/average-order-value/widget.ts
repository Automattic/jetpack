/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { ChartDisplayChartType } from '@automattic/jetpack-premium-analytics-sdk';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * @property chartType - How the series is drawn. Defaults to `line`.
 */
export type AverageOrderValueAttributes = {
	chartType?: ChartDisplayChartType;
};

const CHART_TYPES = [
	{
		value: 'line',
		label: __( 'Line chart', 'jetpack-woocommerce-stats-pkg' ),
		icon: 'jpa/chart-line',
	},
	{
		value: 'bar',
		label: __( 'Bar chart', 'jetpack-woocommerce-stats-pkg' ),
		icon: 'jpa/chart-bar',
	},
];

export default {
	attributes: [
		{
			id: 'chartType',
			label: __( 'Chart type', 'jetpack-woocommerce-stats-pkg' ),
			type: 'jpa/toggle-group',
			elements: CHART_TYPES,
			relevance: 'high',
		},
	] as WidgetAttributeField< AverageOrderValueAttributes >[],
};
