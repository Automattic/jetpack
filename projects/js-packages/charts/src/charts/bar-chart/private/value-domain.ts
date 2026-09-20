import type { SeriesData } from '../../../types';

/** Domain for a value axis that has nothing to scale, so its ticks still read 0 to 1. */
const EMPTY_DOMAIN: [ number, number ] = [ 0, 1 ];

/**
 * An explicit domain for the value scale, or null to let visx fit one to the data.
 *
 * Fitting is right for ordinary varying data, but it collapses to zero height when every
 * value is the same, and produces no domain at all when no bucket has a reading.
 *
 * @param data                - Every series handed to the chart.
 * @param hasComparisonSeries - Whether a comparison series is present.
 * @return Value domain, or null when visx should fit its own.
 */
export const getValueScaleDomain = (
	data: SeriesData[],
	hasComparisonSeries: boolean
): [ number, number ] | null => {
	let min = Infinity;
	let max = -Infinity;

	for ( const series of data ) {
		for ( const point of series.data ) {
			const enhanced = point as { visualValue?: number };
			const value = enhanced.visualValue !== undefined ? enhanced.visualValue : point.value;
			if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
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
