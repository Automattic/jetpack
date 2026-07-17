/**
 * Resolve a report's `post_id` param to a positive integer. Report params can
 * come directly from the URL as strings, while `0` consistently signals that
 * no post is selected and keeps post-scoped queries disabled.
 *
 * @param value - The raw `post_id` report param.
 * @return The selected post ID, or `0` when the value is invalid or absent.
 */
export function toPostId( value: string | number | undefined ): number {
	const parsed = Number( value );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : 0;
}
