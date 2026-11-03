/**
 * Resolve a scoping id param to a positive integer, or `0` (query disabled).
 * Widgets re-apply this after `normalizeReportParams()` because `ReportParams`
 * types ids as `string | number`, looser than normalization guarantees.
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

/**
 * Find the author's row in a `stats/top-authors` list; the endpoint types the
 * id as a string or a number depending on the shape, so match on the string.
 *
 * @param rows     - Author rows, each carrying the author's user ID as `id`.
 * @param authorId - The author's user ID.
 * @return The author's row, or `undefined` when the ranking left the author out.
 */
export function findAuthorRow< TRow extends { id?: string | number } >(
	rows: readonly TRow[] | undefined,
	authorId: number
): TRow | undefined {
	return rows?.find( row => String( row.id ) === String( authorId ) );
}
