/**
 * Internal dependencies
 */
import { getEmptyChartDomain, type SeriesWithData } from './chart-empty-state';

/**
 * Where a line chart's value axis starts: at zero, so the line's height reads as
 * the value, or padded a little below the data, for a cumulative count whose
 * changes would vanish against a zero baseline.
 */
export type ChartBaseline = 'zero' | 'padded';

/** How much of the minimum may sit below the data as padding. */
const PADDING_RATIO = 0.2;

/** Fewer units than this and the axis falls back to fractional, duplicate-looking ticks. */
const MIN_SPAN = 4;

/**
 * A y-axis domain pinned by the chart rather than derived from the data.
 */
export type FixedYAxis = {
	/** Y-axis domain tuple [min, max]. */
	domain: [ number, number ];
};

/**
 * Resolve the y-axis domain a comparative chart should pin, if any: a percentage
 * metric always reads 0–100%, and an all-zero period gets a real axis instead of
 * a flat baseline.
 *
 * @param metricType  - The data format type (currency, number, percentage).
 * @param isEmptyData - Whether every value in the chart is 0 or null.
 * @return The domain, or null to let the chart scale to the data.
 */
export function getFixedYAxis( metricType: string, isEmptyData: boolean ): FixedYAxis | null {
	let domain: [ number, number ] | null = null;

	if ( metricType === 'percentage' ) {
		domain = [ 0, 1.0 ];
	} else if ( isEmptyData ) {
		domain = getEmptyChartDomain( metricType );
	}

	if ( ! domain ) {
		return null;
	}

	return { domain };
}

/**
 * A domain that starts a little below the data, so the data fills about half the
 * chart: the padding is the data's range, capped at a fifth of its minimum, and
 * never crosses zero. Mirrors wp-calypso's subscriber chart (STATS-229, wp-calypso#109481).
 *
 * @param series - Every series the chart draws.
 * @return The domain, or null when the data reaches zero or has no reading.
 */
export function getPaddedYDomain( series: SeriesWithData[] ): [ number, number ] | null {
	let min = Infinity;
	let max = -Infinity;
	for ( const { data } of series ) {
		for ( const { value } of data ) {
			if ( typeof value === 'number' && Number.isFinite( value ) ) {
				min = Math.min( min, value );
				max = Math.max( max, value );
			}
		}
	}

	if ( min <= 0 || min === Infinity ) {
		return null;
	}

	const range = max - min;
	const cap = min * PADDING_RATIO;
	// A flat series has no range to pad by; the cap alone gives it an axis.
	const padding = Math.max( range === 0 ? cap : Math.min( range, cap ), MIN_SPAN - range );
	return [ Math.max( 0, Math.floor( min - padding ) ), max ];
}
