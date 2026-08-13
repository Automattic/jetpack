/**
 * External dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { MetricTabsChartType } from '../components/metric-tabs-chart/metric-tabs-chart';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The chart types the display control offers, in menu order. One list keeps
 * every chart widget's dropdown identical, and `satisfies` ties it to the
 * toolkit's own union so a value `MetricTabsChart` cannot draw fails to
 * compile here rather than shipping as a broken dropdown option.
 */
export const CHART_DISPLAY_CHART_TYPES = [
	{ id: 'line', label: __( 'Line chart', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'bar', label: __( 'Bar chart', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: MetricTabsChartType; label: string }[];

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
 * The "Chart type" attribute field (`relevance: 'high'`), offering the
 * chart types in `CHART_DISPLAY_CHART_TYPES`.
 */
export function chartTypeAttributeField<
	Attributes extends { chartType?: ChartDisplayChartType },
>(): WidgetAttributeField< Attributes > {
	return {
		id: 'chartType',
		label: __( 'Chart type', 'jetpack-premium-analytics-pkg' ),
		type: 'text',
		Edit: SelectField,
		elements: CHART_DISPLAY_CHART_TYPES.map( chartType => ( {
			value: chartType.id,
			label: chartType.label,
		} ) ),
		relevance: 'high',
	} as WidgetAttributeField< Attributes >;
}
