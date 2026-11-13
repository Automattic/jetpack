import { HEATMAP_SCALE_STEPS, isEmptyValue } from './use-heatmap-colors';

/**
 * The cut points between color steps, and the step count the legend draws. No
 * thresholds means fewer than two distinct eligible values.
 */
export type HeatmapBuckets = { thresholds: number[]; steps: number };

/**
 * Split a series into `steps` color buckets of roughly equal population, so a
 * cell's shade reports its rank among the other cells rather than its distance
 * from the largest one. Ties can leave fewer buckets than asked for.
 *
 * @param values - The series values, ascending, from `scaleValues`
 * @param extent - The extent from `getExtentOf`
 * @param steps  - How many color steps to aim for
 * @return The thresholds and the step count `getBucketedValue` reads
 */
export const getValueBuckets = (
	values: number[],
	extent: [ number, number ],
	steps: number = HEATMAP_SCALE_STEPS
): HeatmapBuckets => {
	const eligible = values.filter( value => ! isEmptyValue( value, extent ) );
	if ( ! eligible.length ) {
		return { thresholds: [], steps };
	}

	const min = eligible[ 0 ];
	const thresholds: number[] = [];
	const last = () => thresholds[ thresholds.length - 1 ] ?? min;

	for ( let step = 1; step < steps; step++ ) {
		const index = Math.min( eligible.length - 1, Math.floor( ( eligible.length * step ) / steps ) );
		// A value repeated often enough to span several quantiles would leave the
		// scale short of steps, so the quantile gives way to the next value above
		// the last cut point. Waiting until the quantiles are done instead pins the
		// high cut points first, and the values below them can no longer be split.
		const cut =
			eligible[ index ] > last() ? eligible[ index ] : eligible.find( value => value > last() );

		if ( cut === undefined ) {
			break;
		}

		thresholds.push( cut );
	}

	return { thresholds, steps };
};

/**
 * Place a value on its bucket, as the 0–1 position of a legend swatch, so a
 * cell always matches one. Fewer than two distinct eligible values paints at 1,
 * since every cell is then equally the highest.
 *
 * @param value   - The cell value
 * @param buckets - The buckets from `getValueBuckets`
 * @return The swatch position between 0 and 1
 */
export const getBucketedValue = ( value: number, buckets: HeatmapBuckets ): number => {
	const { thresholds, steps } = buckets;
	if ( ! thresholds.length ) {
		return 1;
	}
	const index = thresholds.filter( threshold => value >= threshold ).length;
	return Math.round( ( index * ( steps - 1 ) ) / thresholds.length ) / ( steps - 1 );
};
