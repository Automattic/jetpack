/**
 * Internal dependencies
 */
import type { BarChartData } from '../chart-bar/bar-chart';
import type { LegendLabels } from '../chart-leaderboard/leaderboard-chart';

/**
 * One column of the chart, in the widget's own terms.
 */
export type ColumnInput = {
	/**
	 * Label text, on the x axis and in the tooltip. Unique within the chart.
	 */
	label: string;
	/**
	 * Figure for the selected period.
	 */
	value: number;
	/**
	 * Figure for the comparison period; `undefined` draws as 0 there.
	 */
	previousValue?: number;
};

export type ColumnsChartDataOptions = {
	/**
	 * Whether the comparison period is on: its series exists only then.
	 */
	hasComparison: boolean;
	/**
	 * The names of the two periods, which label the series and the legend.
	 */
	labels: LegendLabels;
};

/**
 * Turns the columns into the chart's series: one for the selected period and, when comparing,
 * one for the comparison period, both over the same categories.
 *
 * @param columns - The columns, in display order.
 * @param options - The comparison flag and the period names.
 * @return The chart series.
 */
export function buildColumnsChartData(
	columns: readonly ColumnInput[],
	options: ColumnsChartDataOptions
): BarChartData {
	const { hasComparison, labels } = options;
	const series: BarChartData = [
		{
			label: labels.primary,
			data: columns.map( column => ( { label: column.label, value: column.value } ) ),
		},
	];

	if ( hasComparison ) {
		series.push( {
			label: labels.comparison,
			data: columns.map( column => ( {
				label: column.label,
				value: column.previousValue ?? 0,
			} ) ),
		} );
	}

	return series;
}
