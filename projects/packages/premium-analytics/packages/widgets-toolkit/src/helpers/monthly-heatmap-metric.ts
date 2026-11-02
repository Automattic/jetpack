/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { MonthlyHeatmapProps } from '../components/monthly-heatmap';

/** Which number each cell of a monthly views table reports: the month's views, or its views per day. */
export type MonthlyHeatmapMetric = 'total' | 'average';

// The options the widgets' `metric` select offers, as their `widget.json` lists them.
const MONTHLY_HEATMAP_METRICS: readonly MonthlyHeatmapMetric[] = [ 'total', 'average' ];

/**
 * The metric a stored instance names; anything that is not one reads as the total.
 *
 * @param value - The raw `metric` attribute.
 * @return The metric to draw.
 */
export function resolveMonthlyHeatmapMetric( value: unknown ): MonthlyHeatmapMetric {
	return MONTHLY_HEATMAP_METRICS.includes( value as MonthlyHeatmapMetric )
		? ( value as MonthlyHeatmapMetric )
		: 'total';
}

// The one-line tooltip carries the figure alone; the scale labels name the
// unit, so the average is rounded here rather than read as "1.4 views".
function formatCellValue( value: number ): string {
	return formatMetricValue( Math.round( value ), 'number', { decimals: 0 } );
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
			formatValue: formatCellValue,
			emptyLabel,
			lessLabel: __( 'Fewer views per day', 'jetpack-premium-analytics-pkg' ),
			moreLabel: __( 'More views per day', 'jetpack-premium-analytics-pkg' ),
		};
	}

	return {
		formatValue: formatCellValue,
		emptyLabel,
		lessLabel: __( 'Fewer views', 'jetpack-premium-analytics-pkg' ),
		moreLabel: __( 'More views', 'jetpack-premium-analytics-pkg' ),
	};
}
