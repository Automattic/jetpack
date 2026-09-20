import type { EnhancedDataPoint } from '../../../hooks/use-zero-value-display';
import type { DataPoint, DataPointDate, SeriesData } from '../../../types';

/** Domain for a value axis that has nothing to scale, so its ticks still read 0 to 1. */
const EMPTY_DOMAIN: [ number, number ] = [ 0, 1 ];

/**
 * The value a bar is drawn at, preferring `visualValue` so a zero still shows a sliver.
 *
 * visx skips a bar whose scaled value is not a number. A null would scale to zero and
 * draw an invisible rect that still answers the pointer, so it becomes NaN instead.
 *
 * @param point - A data point handed to visx.
 * @return The bar value, or NaN when the bucket has no reading.
 */
export const getBarValue = ( point: DataPoint | DataPointDate | EnhancedDataPoint ): number => {
	const enhanced = point as EnhancedDataPoint;
	const value = enhanced?.visualValue !== undefined ? enhanced.visualValue : point?.value;
	return value ?? NaN;
};

/**
 * Whether visx renders a bar for a point.
 *
 * @param point - A data point handed to visx.
 * @return True when the point has a finite bar value.
 */
export const isBarRendered = ( point: DataPoint | DataPointDate | EnhancedDataPoint ): boolean =>
	Number.isFinite( getBarValue( point ) );

/**
 * How many bars visx renders for a list of points.
 *
 * @param points - Data points handed to visx.
 * @return The number of points that get a bar.
 */
export const countRenderedBars = (
	points: ReadonlyArray< DataPoint | DataPointDate | EnhancedDataPoint >
): number => points.filter( isBarRendered ).length;

/**
 * An explicit domain for the value scale, or null to let visx fit one to the data.
 *
 * Fitting is right for ordinary varying data, but it collapses to zero height when every
 * value is the same, and produces no domain at all when no bucket has a reading.
 *
 * @param data                - Every series handed to the chart.
 * @param hasComparisonSeries - Whether a comparison series is present.
 * @param isSeriesRendered    - Whether visx mounts a series, i.e. the legend shows it.
 * @return Value domain, or null when visx should fit its own.
 */
export const getValueScaleDomain = (
	data: SeriesData[],
	hasComparisonSeries: boolean,
	isSeriesRendered: ( series: SeriesData ) => boolean
): [ number, number ] | null => {
	let min = Infinity;
	let max = -Infinity;

	for ( const series of data ) {
		// Comparison series still count: the comparison rule below widens the domain for them.
		if ( ! isSeriesRendered( series ) ) {
			continue;
		}
		for ( const point of series.data ) {
			const value = getBarValue( point );
			if ( ! Number.isFinite( value ) ) {
				continue;
			}
			min = Math.min( min, value );
			max = Math.max( max, value );
		}
	}

	if ( min === Infinity ) {
		return EMPTY_DOMAIN;
	}

	// Keep zero in the domain so bar length stays proportional to value. A non-zero
	// baseline would exaggerate differences between periods.
	if ( min === max ) {
		return min === 0 ? EMPTY_DOMAIN : [ Math.min( 0, min ), Math.max( 0, max ) ];
	}

	// visx only sees primary BarSeries and would compute a domain too narrow for the
	// comparison shadows, which are drawn onto the scales the primary series established.
	if ( hasComparisonSeries ) {
		return [ Math.min( 0, min ), Math.max( 0, max ) ];
	}

	return null;
};
