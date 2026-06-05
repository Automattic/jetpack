/**
 * Calculates the percentage change (delta) between two values.
 *
 * Handles edge cases where the previous value is zero:
 * - 0 → 0: Returns 0% (no change)
 * - 0 → positive: Returns 100% (instead of infinity, representing "new/appeared")
 * - 0 → negative: Returns 0% (no meaningful decrease from zero)
 *
 * @param currentValue  - Current period value
 * @param previousValue - Previous period value
 * @return Percentage change as a number (e.g., 50 for 50% increase, -25 for 25% decrease)
 *
 * @example
 * calculateDelta(150, 100) // Returns 50 (50% increase)
 * calculateDelta(75, 100)  // Returns -25 (25% decrease)
 * calculateDelta(100, 0)   // Returns 100 (new item, instead of infinity)
 * calculateDelta(0, 0)     // Returns 0 (no change)
 * calculateDelta(0, 100)   // Returns -100 (complete disappearance)
 */
export function calculateDelta( currentValue: number, previousValue: number ): number {
	// Handle the case where previous value is zero
	if ( previousValue === 0 ) {
		// If previous was 0 and current is positive, show 100% increase
		// If both are 0, show 0% change
		return currentValue > 0 ? 100 : 0;
	}

	// Standard percentage change calculation
	return ( ( currentValue - previousValue ) / previousValue ) * 100;
}
