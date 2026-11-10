import { getTickDecimalsDomain } from '../../private/tick-decimals';
import type { EnhancedDataPoint } from '../../../hooks/use-zero-value-display';
import type { DataPoint, DataPointDate, SeriesData } from '../../../types';

/** Domain for a value axis that has nothing to scale, so its ticks still read 0 to 1. */
export const EMPTY_DOMAIN: [ number, number ] = [ 0, 1 ];

/**
 * The value a bar is drawn at, preferring `visualValue` so a zero still shows a sliver.
 *
 * A missing reading is NaN, not null: `ComparisonBars` coerces the value with `Number()`,
 * which turns null into 0 and would draw a comparison shadow at the baseline.
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
 * An explicit domain for the value scale, or null to let visx fit one to the data.
 *
 * Zero goes into the domain here rather than through the scale's `zero` flag: visx applies
 * `nice` before `zero`, which would leave the axis topping out at a raw maximum.
 *
 * @param data             - Every series handed to the chart.
 * @param includeZero      - Whether the domain must span zero.
 * @param isSeriesRendered - Whether visx mounts a series, i.e. the legend shows it.
 * @param tickDecimals     - The value axis's `tickDecimals`.
 * @return Value domain, or null when visx should fit its own.
 */
export const getValueScaleDomain = (
	data: SeriesData[],
	includeZero: boolean,
	isSeriesRendered: ( series: SeriesData ) => boolean,
	tickDecimals?: number
): [ number, number ] | null => {
	let min = Infinity;
	let max = -Infinity;

	// Only hidden series are skipped. Comparison series count too: visx sees just the
	// primary BarSeries and would fit a domain too narrow for the comparison shadows.
	for ( const series of data ) {
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
		return [ ...EMPTY_DOMAIN ];
	}

	let domain: [ number, number ] | null = null;
	// A flat series fitted by visx collapses to zero height, so it is anchored at zero regardless.
	if ( min === max ) {
		domain = min === 0 ? [ ...EMPTY_DOMAIN ] : [ Math.min( 0, min ), Math.max( 0, max ) ];
	} else if ( includeZero ) {
		domain = [ Math.min( 0, min ), Math.max( 0, max ) ];
	}

	return getTickDecimalsDomain( domain ?? [ min, max ], tickDecimals ) ?? domain;
};
