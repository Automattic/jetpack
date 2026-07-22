/**
 * Find the largest value represented across a primary and comparison period.
 * Leaderboard comparison bars share this denominator so their widths remain
 * directly comparable across periods.
 *
 * @param currentValues  - Values from the primary period.
 * @param previousValues - Matching values from the comparison period. Missing
 *                       matches should remain undefined.
 * @return The largest non-negative value across both periods.
 */
export function getCombinedPeriodMax(
	currentValues: readonly number[],
	previousValues: readonly ( number | undefined )[] = []
): number {
	let maxValue = 0;

	for ( const value of currentValues ) {
		maxValue = Math.max( maxValue, value );
	}

	for ( const value of previousValues ) {
		maxValue = Math.max( maxValue, value ?? 0 );
	}

	return maxValue;
}
