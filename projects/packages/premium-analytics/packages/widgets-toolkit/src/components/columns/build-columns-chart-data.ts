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
	 * Figure for the comparison period; `undefined` draws as 0 there while another column carries
	 * one, and `null`, a period with no figure for the column, draws no bar.
	 */
	previousValue?: number | null;
};

export type ColumnsChartDataOptions = {
	/**
	 * Whether the comparison period is on. Its series draws only when it is on and at least one
	 * column carries a previous figure: a period that failed to load draws nothing, not zeros.
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

	const comparing =
		hasComparison && columns.some( column => typeof column.previousValue === 'number' );
	if ( comparing ) {
		series.push( {
			label: labels.comparison,
			data: columns.map( column => ( {
				label: column.label,
				value: column.previousValue === null ? null : ( column.previousValue ?? 0 ),
			} ) ),
		} );
	}

	return series;
}
