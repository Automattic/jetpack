import { getValueExtent, isEmptyValue, scaleValues } from './use-heatmap-colors';
import type { HeatmapColumn } from '../types';

export const HEATMAP_SCALE_STEPS = 5;

/**
 * The cut points between color steps, and the number to divide a step index by.
 * A `divisor` of 0 means the series holds one distinct value.
 */
export type HeatmapBuckets = { thresholds: number[]; divisor: number };

/**
 * Split a series into `steps` color buckets of roughly equal population, so a
 * cell's shade reports its rank among the other cells rather than its distance
 * from the largest one. Ties can leave fewer buckets than asked for.
 *
 * @param data  - The heatmap columns
 * @param steps - How many color steps to aim for
 * @return The thresholds and the divisor `getBucketedValue` reads
 */
export const getValueBuckets = ( data: HeatmapColumn[], steps: number ): HeatmapBuckets => {
	const extent = getValueExtent( data );
	const eligible = scaleValues( data ).filter( value => ! isEmptyValue( value, extent ) );
	if ( ! eligible.length ) {
		return { thresholds: [], divisor: 0 };
	}

	const min = eligible[ 0 ];
	const thresholds: number[] = [];
	const last = () => thresholds[ thresholds.length - 1 ] ?? min;

	for ( let step = 1; step < steps; step++ ) {
		const index = Math.min( eligible.length - 1, Math.floor( ( eligible.length * step ) / steps ) );
		if ( eligible[ index ] > last() ) {
			thresholds.push( eligible[ index ] );
		}
	}
	// A value repeated often enough to span several quantiles leaves the scale
	// short of steps, so spend what is left on the distinct values above it.
	for ( const value of eligible ) {
		if ( thresholds.length >= steps - 1 ) {
			break;
		}
		if ( value > last() ) {
			thresholds.push( value );
		}
	}

	return { thresholds, divisor: thresholds.length };
};

/**
 * Place a value on its bucket, as 0–1 for the fill to blend with. A series of
 * one distinct value paints at 1, since every cell is equally the highest.
 *
 * @param value   - The cell value
 * @param buckets - The buckets from `getValueBuckets`
 * @return The bucket's position between 0 and 1
 */
export const getBucketedValue = ( value: number, buckets: HeatmapBuckets ): number => {
	if ( buckets.divisor === 0 ) {
		return 1;
	}
	return buckets.thresholds.filter( threshold => value >= threshold ).length / buckets.divisor;
};
