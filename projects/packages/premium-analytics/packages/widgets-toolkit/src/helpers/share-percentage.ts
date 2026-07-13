/**
 * A value's share of a maximum, as a percentage. Returns 0 instead of NaN
 * when the maximum is 0, so a row with a real defined comparison value still
 * gets a defined share value.
 *
 * @param value - The value to share against the maximum.
 * @param max   - The maximum value in the comparison set.
 * @return The value's share of the maximum, as a percentage.
 */
export function sharePercentage( value: number, max: number ): number {
	return max > 0 ? ( value / max ) * 100 : 0;
}
