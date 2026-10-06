/**
 * A bucket's own span: `date` is where it starts, `endDate` its last instant.
 */
export type BucketSpan = {
	date?: Date;
	endDate?: Date;
};

function overlapMs( primary: BucketSpan, comparison: BucketSpan, offsetMs: number ): number {
	if ( ! primary.date || ! primary.endDate || ! comparison.date || ! comparison.endDate ) {
		return 0;
	}

	const start = Math.max( primary.date.getTime(), comparison.date.getTime() + offsetMs );
	const end = Math.min( primary.endDate.getTime(), comparison.endDate.getTime() + offsetMs );

	return Math.max( 0, end - start );
}

/**
 * How many leading comparison buckets to skip so the buckets, paired in order, overlap
 * most. A comparison starting on a Sunday opens with a one-day week that pairing by
 * index would put under the first current week (UNI-843).
 *
 * @param primary    - The current period's buckets, oldest first.
 * @param comparison - The comparison period's buckets, oldest first.
 * @return The number of comparison buckets to skip; 0 when spans are unknown.
 */
export function getComparisonBucketShift(
	primary: readonly BucketSpan[],
	comparison: readonly BucketSpan[]
): number {
	const primaryStart = primary[ 0 ]?.date;
	const comparisonStart = comparison[ 0 ]?.date;

	if ( ! primaryStart || ! comparisonStart ) {
		return 0;
	}

	// The two periods start on their range's first day, since edge weeks are clipped to it.
	const offsetMs = primaryStart.getTime() - comparisonStart.getTime();
	let best = { shift: 0, overlap: -1 };

	// Not only when the comparison has more buckets: a one-day week at each end evens the count.
	for ( let shift = 0; shift < comparison.length; shift++ ) {
		const overlap = primary.reduce(
			( total, bucket, index ) =>
				total + overlapMs( bucket, comparison[ index + shift ] ?? {}, offsetMs ),
			0
		);

		if ( overlap > best.overlap ) {
			best = { shift, overlap };
		}
	}

	return best.shift;
}
