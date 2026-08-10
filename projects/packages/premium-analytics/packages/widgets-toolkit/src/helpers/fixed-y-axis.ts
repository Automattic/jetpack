/**
 * Internal dependencies
 */
import { getEmptyChartDomain } from './chart-empty-state';

/**
 * A y-axis domain pinned by the chart rather than derived from the data, plus
 * the left margin that domain needs.
 */
export type FixedYAxis = {
	/** Y-axis domain tuple [min, max]. */
	domain: [ number, number ];
	/** Left margin, in px, wide enough for the domain's longest tick label. */
	marginLeft: number;
};

/**
 * Resolve the y-axis domain a comparative chart should pin, if any.
 *
 * Two cases want a fixed domain instead of the data's own range: a percentage
 * metric always reads 0%–100%, so a series sitting between 2% and 5% doesn't
 * fill the plot; and an all-zero period gets a real axis instead of a flat
 * baseline.
 *
 * A pinned domain has to carry its own left margin. `useChartMargin` sizes the
 * axis gutter by re-deriving ticks from the data's own min/max — it overwrites
 * `options.yScale.domain` while doing so — so the widest tick of a pinned domain
 * would otherwise be drawn outside the gutter reserved for it and clipped.
 *
 * @param metricType  - The data format type (currency, number, percentage).
 * @param isEmptyData - Whether every value in the chart is 0 or null.
 * @param formatTick  - The chart's y-axis tick formatter, used to size the margin.
 * @return The domain and its margin, or null to let the chart scale to the data.
 */
export function getFixedYAxis(
	metricType: string,
	isEmptyData: boolean,
	formatTick: ( value: number ) => string
): FixedYAxis | null {
	let domain: [ number, number ] | null = null;

	if ( metricType === 'percentage' ) {
		domain = [ 0, 1.0 ];
	} else if ( isEmptyData ) {
		domain = getEmptyChartDomain( metricType );
	}

	if ( ! domain ) {
		return null;
	}

	// Rough but stable: the chart library gives us no way to measure the rendered
	// tick, so estimate from the formatted string's length.
	return { domain, marginLeft: formatTick( domain[ 1 ] ).length * 10 };
}
