/**
 * Resolve a `post_id` report param to a positive integer, or `0` when there is
 * no valid post scope. `0` keeps post-scoped queries disabled.
 *
 * `normalizeReportParams()` applies this to raw URL search params, where
 * `post_id` really is a string. Widgets re-apply it because `ReportParams` types
 * the param as `string | number`, looser than normalization guarantees.
 */
export function toPostId( value: string | number | undefined ): number {
	const parsed = Number( value );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : 0;
}
