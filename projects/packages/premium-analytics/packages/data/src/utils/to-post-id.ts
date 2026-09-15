/**
 * Resolve a scoping id param to a positive integer, or `0` when it is absent
 * or malformed. `0` keeps scoped queries disabled.
 *
 * `normalizeReportParams()` applies these to raw URL search params, where the
 * ids really are strings. Widgets re-apply them because `ReportParams` types
 * the params as `string | number`, looser than normalization guarantees.
 */
function toPositiveId( value: string | number | undefined ): number {
	const parsed = Number( value );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : 0;
}

/**
 * Resolve a `post_id` report param (detail page post/page scope).
 *
 * @param value - The raw param.
 * @return The post ID, or `0` when there is no valid post scope.
 */
export function toPostId( value: string | number | undefined ): number {
	return toPositiveId( value );
}

/**
 * Resolve an `author_id` report param (author detail page scope).
 *
 * @param value - The raw param.
 * @return The author's user ID, or `0` when there is no valid author scope.
 */
export function toAuthorId( value: string | number | undefined ): number {
	return toPositiveId( value );
}
