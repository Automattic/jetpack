/**
 * Resolve a widget's `max` attribute to the row count requested from Stats.
 * Per the Stats widget contract `max = 0` means "all rows", so it passes
 * through; only negative or non-numeric values fall back to the default.
 * Integer form controls can serialize the attribute to a string, so both
 * forms are accepted.
 *
 * @param value    - The raw `max` attribute value.
 * @param fallback - The widget's default row count.
 * @return The row count to request.
 */
export function toMaxRows( value: string | number | undefined, fallback: number ) {
	const parsed = typeof value === 'number' ? value : Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed >= 0 ? parsed : fallback;
}
