/**
 * External dependencies
 */
import { ToggleGroupField } from '@jetpack-premium-analytics/fields';
import { chartLine } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { MetricTabsChartType } from '../components/metric-tabs-chart/metric-tabs-chart';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';
import type { ReactElement } from 'react';

/**
 * The chart types the display control offers, in segment order — one list keeps
 * every widget's control identical. `satisfies` ties it to the toolkit's union
 * so an unsupported type fails to compile here instead of shipping broken.
 */
export const CHART_DISPLAY_CHART_TYPES = [
	{ id: 'line', label: __( 'Line chart', 'jetpack-premium-analytics-pkg' ), icon: chartLine },
	{ id: 'bar', label: __( 'Bar chart', 'jetpack-premium-analytics-pkg' ), icon: chartBar },
] as const satisfies readonly {
	id: MetricTabsChartType;
	label: string;
	icon: ReactElement;
}[];

export type ChartDisplayChartType = ( typeof CHART_DISPLAY_CHART_TYPES )[ number ][ 'id' ];

/**
 * The "Chart type" attribute field (`relevance: 'high'`), offering the chart
 * types in `CHART_DISPLAY_CHART_TYPES` as an icon toggle: two mutually
 * exclusive options both worth showing at a glance.
 */
export function chartTypeAttributeField<
	Attributes extends { chartType?: ChartDisplayChartType },
>(): WidgetAttributeField< Attributes > {
	return {
		id: 'chartType',
		label: __( 'Chart type', 'jetpack-premium-analytics-pkg' ),
		type: 'text',
		Edit: ToggleGroupField,
		elements: CHART_DISPLAY_CHART_TYPES.map( chartType => ( {
			value: chartType.id,
			label: chartType.label,
			icon: chartType.icon,
		} ) ),
		relevance: 'high',
	} as WidgetAttributeField< Attributes >;
}
