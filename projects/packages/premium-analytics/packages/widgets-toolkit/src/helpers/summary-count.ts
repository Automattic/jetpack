/**
 * Read a numeric field from a Stats summary. Summaries carry dynamic WPCOM keys
 * whose values arrive numeric or as numeric strings, so both forms are accepted
 * and anything else reads as absent — letting callers skip a metric rather than
 * render a misleading `0`.
 *
 * @param summary - The normalized summary, or undefined while loading.
 * @param key     - The summary field to read.
 * @return The finite number, or undefined when unavailable.
 */
export function summaryCount(
	summary: Record< string, unknown > | undefined,
	key: string
): number | undefined {
	const value = summary?.[ key ];
	const parsed = typeof value === 'string' ? Number( value ) : value;

	return typeof parsed === 'number' && Number.isFinite( parsed ) ? parsed : undefined;
}
