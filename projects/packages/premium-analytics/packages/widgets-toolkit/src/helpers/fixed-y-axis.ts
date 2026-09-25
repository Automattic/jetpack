/**
 * External dependencies
 */
import { scaleLinear } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
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

/** LineChart's `numTicks`; the axis draws about this many steps. */
const Y_TICK_COUNT = 4;

/** A shorter span lands the ticks on fractions, which round to duplicate labels. */
const MIN_SPAN = Y_TICK_COUNT;

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
 * An axis that starts a little below the data, so the data fills about half the
 * chart: the padding is the data's range, capped at a fifth of its minimum. After
 * wp-calypso's subscriber chart (STATS-229, wp-calypso#109481).
 *
 * @param series - The series the chart is drawing.
 * @return The axis, or null when it would start at or below zero, or there is no reading.
 */
export function getPaddedYAxis( series: SeriesWithData[] ): FixedYAxis | null {
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

	if ( min === Infinity ) {
		return null;
	}

	const range = max - min;
	const cap = min * PADDING_RATIO;
	// A flat series has no range to pad by; the cap alone gives it an axis.
	const rangePadding = range === 0 ? cap : Math.min( range, cap );
	const padding = Math.max( rangePadding, MIN_SPAN - range );
	const start = Math.floor( min - padding );

	// At zero the padded axis is the zero baseline, which the chart draws itself.
	return start > 0 ? { domain: [ start, max ] } : null;
}

/**
 * The ticks LineChart draws across a pinned domain, which it nices before ticking.
 *
 * @param domain - The pinned y-axis domain.
 * @return The tick values.
 */
export function getPinnedYTicks( domain: [ number, number ] ): number[] {
	return scaleLinear( { domain, nice: true } ).ticks( Y_TICK_COUNT );
}

/**
 * A y-axis label format: compact, unless compact labels would repeat across `ticks`,
 * as 4,190 and 4,195 both read 4.2K.
 *
 * @param metricType - The data format type (currency, number, percentage).
 * @param ticks      - The ticks the axis draws, when the chart pins them.
 * @return The tick formatter.
 */
export function getYTickFormat(
	metricType: Parameters< typeof formatMetricValue >[ 1 ],
	ticks?: number[]
) {
	const compact = ( value: number ) =>
		formatMetricValue( value, metricType, { useMultipliers: true } );
	if ( ! ticks || new Set( ticks.map( compact ) ).size === ticks.length ) {
		return compact;
	}
	return ( value: number ) => formatMetricValue( value, metricType );
}
