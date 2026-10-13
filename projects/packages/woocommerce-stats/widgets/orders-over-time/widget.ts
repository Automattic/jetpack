/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { chartLine } from '../../src/icons/chart-line';
import type { ChartDisplayChartType } from '@automattic/jetpack-premium-analytics-sdk';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * @property chartType - How the series is drawn. Defaults to `line`.
 */
export type OrdersOverTimeAttributes = {
	chartType?: ChartDisplayChartType;
};

const CHART_TYPES = [
	{ value: 'line', label: __( 'Line chart', 'jetpack-woocommerce-stats-pkg' ), icon: chartLine },
	{ value: 'bar', label: __( 'Bar chart', 'jetpack-woocommerce-stats-pkg' ), icon: chartBar },
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
	] as WidgetAttributeField< OrdersOverTimeAttributes >[],
};
