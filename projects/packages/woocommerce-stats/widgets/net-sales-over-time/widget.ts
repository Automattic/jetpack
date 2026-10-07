/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { ChartDisplayChartType } from '@automattic/jetpack-premium-analytics-sdk';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * @property chartType - How the series is drawn. Defaults to `line`.
 */
export type NetSalesOverTimeAttributes = {
	chartType?: ChartDisplayChartType;
};

export default {
	icon: chartBar,
	attributes: [
		{
			id: 'chartType',
			label: __( 'Chart type', 'jetpack-woocommerce-stats-pkg' ),
			type: 'jpa/line-or-bar',
			relevance: 'high',
		},
	] as WidgetAttributeField< NetSalesOverTimeAttributes >[],
};
