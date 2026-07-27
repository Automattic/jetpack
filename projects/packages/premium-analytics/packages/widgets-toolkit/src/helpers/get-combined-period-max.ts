/**
 * Find the largest value represented across a primary and comparison period.
 * Leaderboard comparison bars share this denominator so their widths remain
 * directly comparable across periods.
 *
 * @param currentValues  - Values from the primary period.
 * @param previousValues - Matching values from the comparison period. Missing
 *                       matches should remain undefined.
 * @return The largest value across both periods, clamped to a minimum of 0
 *         (empty or entirely negative input yields 0; sharePercentage maps a
 *         0 max to 0% shares).
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
