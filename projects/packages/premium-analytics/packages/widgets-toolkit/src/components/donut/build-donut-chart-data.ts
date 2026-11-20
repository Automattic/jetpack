/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import type { SegmentStyle } from '../../helpers';
import type { DataFormat } from '../../types';
import type { DonutChartData } from '../chart-donut/donut-chart';
import type { LegendItem } from '../legend/legend';

/**
 * One segment of the breakdown, in the widget's own terms.
 */
export type DonutSegmentInput = {
	/**
	 * Label text, in the chart and the legend. Unique within the breakdown.
	 */
	label: string;
	/**
	 * Value for the selected period.
	 */
	value: number;
	/**
	 * Value for the comparison period; `undefined` when the segment has no match there.
	 */
	previousValue?: number;
	/**
	 * Drawn in the neutral tone instead of a palette color, e.g. a cancelled status.
	 */
	muted?: boolean;
};

export type DonutChartDataOptions = {
	/**
	 * Whether the comparison period is on: the deltas and the previous total exist only then.
	 */
	hasComparison: boolean;
	/**
	 * Format of the segment values.
	 */
	format: DataFormat;
	/**
	 * Palette color per segment, by index.
	 */
	styles: readonly SegmentStyle[];
	/**
	 * The neutral tone of a muted segment.
	 */
	mutedColor: string;
};

export type DonutChartDataResult = {
	chartData: DonutChartData;
	legendData: LegendItem[];
	/**
	 * Sum of the segment values.
	 */
	total: number;
	/**
	 * Sum of the comparison values, or null when the comparison period is off.
	 */
	previousTotal: number | null;
};

/**
 * Turns the segments into the chart's data and legend: colors from the palette or the neutral
 * tone, values formatted for the legend, and the totals of both periods.
 *
 * @param segments - The segments, in display order.
 * @param options  - Comparison flag, format, palette and the neutral tone.
 * @return The chart data, legend data and totals.
 */
export function buildDonutChartData(
	segments: readonly DonutSegmentInput[],
	options: DonutChartDataOptions
): DonutChartDataResult {
	const { hasComparison, format, styles, mutedColor } = options;
	const colors = segments.map( ( segment, index ) =>
		segment.muted ? mutedColor : styles[ index ]?.color
	);

	return {
		chartData: segments.map( ( segment, index ) => ( {
			label: segment.label,
			value: segment.value,
			color: colors[ index ],
		} ) ),
		legendData: segments.map( ( segment, index ) => ( {
			label: segment.label,
			value: segment.value,
			displayValue: formatMetricValue( segment.value, format.type, format.options ),
			color: colors[ index ],
			comparison: hasComparison ? segment.previousValue : undefined,
		} ) ),
		total: segments.reduce( ( sum, segment ) => sum + segment.value, 0 ),
		previousTotal: hasComparison
			? segments.reduce( ( sum, segment ) => sum + ( segment.previousValue ?? 0 ), 0 )
			: null,
	};
}
