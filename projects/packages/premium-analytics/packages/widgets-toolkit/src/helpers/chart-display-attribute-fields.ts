/**
 * External dependencies
 */
import { SelectField, ToggleGroupField } from '@jetpack-premium-analytics/fields';
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
 * The chart types the display control offers, in segment order. One list keeps
 * every chart widget's control identical, and `satisfies` ties it to the
 * toolkit's own union so a value `MetricTabsChart` cannot draw fails to
 * compile here rather than shipping as a broken option. The label names the
 * type for assistive technology and for the segment's tooltip; the icon is
 * what the control shows.
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

export type ChartGranularityOption = 'auto' | 'day' | 'week' | 'month';

const GRANULARITY_LABELS: Record< ChartGranularityOption, () => string > = {
	auto: () => __( 'Auto', 'jetpack-premium-analytics-pkg' ),
	day: () => __( 'By days', 'jetpack-premium-analytics-pkg' ),
	week: () => __( 'By weeks', 'jetpack-premium-analytics-pkg' ),
	month: () => __( 'By months', 'jetpack-premium-analytics-pkg' ),
};

/**
 * The "Group by" attribute field (`relevance: 'high'`, so the widget host
 * renders it as an in-body dropdown). Widgets that follow the dashboard range
 * include `auto`; the detail charts pass explicit buckets only.
 */
export function granularityAttributeField<
	Attributes extends { granularity?: ChartGranularityOption },
>( values: readonly ChartGranularityOption[] ): WidgetAttributeField< Attributes > {
	return {
		id: 'granularity',
		label: __( 'Group by', 'jetpack-premium-analytics-pkg' ),
		type: 'text',
		Edit: SelectField,
		elements: values.map( value => ( { value, label: GRANULARITY_LABELS[ value ]() } ) ),
		relevance: 'high',
	} as WidgetAttributeField< Attributes >;
}

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
