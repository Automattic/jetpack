/**
 * External dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { formatDailyViewCount, formatViewCount } from './format-view-count';
import type { MonthlyHeatmapProps } from '../components/monthly-heatmap';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** Which number each cell of a monthly views table reports: the month's views, or its views per day. */
export type MonthlyHeatmapMetric = 'total' | 'average';

/**
 * The metrics the select offers, in option order. `satisfies` ties the ids to
 * the union so a typo fails to compile instead of silently reading as the total.
 */
export const MONTHLY_HEATMAP_METRICS = [
	{ id: 'total', label: __( 'Total views', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'average', label: __( 'Daily average', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: MonthlyHeatmapMetric; label: string }[];

/**
 * The metric a stored instance names; anything that is not one reads as the total.
 *
 * @param value - The raw `metric` attribute.
 * @return The metric to draw.
 */
export function resolveMonthlyHeatmapMetric( value: unknown ): MonthlyHeatmapMetric {
	return MONTHLY_HEATMAP_METRICS.some( metric => metric.id === value )
		? ( value as MonthlyHeatmapMetric )
		: 'total';
}

/**
 * The "Metric" attribute field (`relevance: 'high'`, so the framed host draws
 * the select in the widget header), offering `MONTHLY_HEATMAP_METRICS`.
 */
export function monthlyHeatmapMetricAttributeField<
	Attributes extends { metric?: MonthlyHeatmapMetric },
>(): WidgetAttributeField< Attributes > {
	return {
		id: 'metric',
		label: _x( 'Metric', 'label for the views metric selector', 'jetpack-premium-analytics-pkg' ),
		type: 'text',
		relevance: 'high',
		Edit: SelectField,
		elements: MONTHLY_HEATMAP_METRICS.map( ( { id, label } ) => ( { value: id, label } ) ),
	} as WidgetAttributeField< Attributes >;
}

/**
 * The tooltip and scale labels of a monthly views table under the metric.
 *
 * @param metric - Which number each cell reports.
 * @return The label props to spread onto `MonthlyHeatmap`.
 */
export function monthlyHeatmapLabels(
	metric: MonthlyHeatmapMetric
): Pick< MonthlyHeatmapProps, 'formatValue' | 'emptyLabel' | 'lessLabel' | 'moreLabel' > {
	const emptyLabel = __( 'No views', 'jetpack-premium-analytics-pkg' );

	if ( metric === 'average' ) {
		return {
			formatValue: formatDailyViewCount,
			emptyLabel,
			lessLabel: __( 'Fewer views per day', 'jetpack-premium-analytics-pkg' ),
			moreLabel: __( 'More views per day', 'jetpack-premium-analytics-pkg' ),
		};
	}

	return {
		formatValue: formatViewCount,
		emptyLabel,
		lessLabel: __( 'Fewer views', 'jetpack-premium-analytics-pkg' ),
		moreLabel: __( 'More views', 'jetpack-premium-analytics-pkg' ),
	};
}
