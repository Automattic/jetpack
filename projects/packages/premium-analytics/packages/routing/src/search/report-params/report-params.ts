/**
 * The URL search params that describe the shared report window (date range,
 * interval, and comparison) — the state every analytics surface has in common.
 *
 * Page-owned params such as `post_id`, `section`, and the report chart's
 * `period` are deliberately excluded, so this set is safe to carry between
 * routes without leaking one page's state onto another.
 */
export const REPORT_DATE_PARAM_KEYS = [
	'from',
	'to',
	'interval',
	'preset',
	'date_type',
	'compare_from',
	'compare_to',
	'compare_preset',
	'comp',
] as const;

/**
 * Pick only the shared report-window params from a URL search object.
 *
 * Used when navigating between analytics routes (e.g. a detail page back to the
 * dashboard) to carry the date range and comparison through without also
 * carrying page-scoped params like `post_id` or `section`.
 *
 * @param search - The current route search params.
 * @return A new object with only the shared report-window params that are set.
 */
export function pickReportDateParams(
	search: Record< string, unknown > | undefined
): Record< string, unknown > {
	if ( ! search ) {
		return {};
	}

	const picked: Record< string, unknown > = {};
	for ( const key of REPORT_DATE_PARAM_KEYS ) {
		if ( search[ key ] !== undefined ) {
			picked[ key ] = search[ key ];
		}
	}
	return picked;
}

/**
 * Build the `to` link back to the dashboard, preserving the shared report window.
 *
 * Serializes the date range and comparison (via `pickReportDateParams`) into a
 * querystring so returning to the dashboard restores the same view. Page-scoped
 * params are dropped.
 *
 * @param search - The current route search params.
 * @return A dashboard `to` path (e.g. `/?from=…&to=…`), or `/` when none are set.
 */
export function buildDashboardLink( search: Record< string, unknown > | undefined ): string {
	const params = pickReportDateParams( search );
	const query = new URLSearchParams(
		Object.entries( params ).map( ( [ key, value ] ) => [ key, String( value ) ] )
	).toString();
	return query ? `/?${ query }` : '/';
}
