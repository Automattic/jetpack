/**
 * Calculates the percentage change (delta) between two values.
 *
 * Handles edge cases where the previous value is zero:
 * - 0 → 0: Returns 0% (no change)
 * - 0 → non-zero: Returns undefined because the percentage change cannot be calculated
 *
 * @param currentValue  - Current period value
 * @param previousValue - Previous period value
 * @return Percentage change, or undefined when it cannot be calculated
 *
 * @example
 * calculateDelta(150, 100) // Returns 50 (50% increase)
 * calculateDelta(75, 100)  // Returns -25 (25% decrease)
 * calculateDelta(100, 0)   // Returns undefined (percentage change from zero is undefined)
 * calculateDelta(0, 0)     // Returns 0 (no change)
 * calculateDelta(0, 100)   // Returns -100 (complete disappearance)
 */
export function calculateDelta( currentValue: number, previousValue: number ): number | undefined {
	if ( previousValue === 0 ) {
		return currentValue === 0 ? 0 : undefined;
	}

	// Standard percentage change calculation
	return ( ( currentValue - previousValue ) / previousValue ) * 100;
}
