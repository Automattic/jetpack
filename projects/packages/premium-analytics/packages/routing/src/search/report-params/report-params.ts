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
 * The params a date picker edits, as opposed to the ones its neighbours own.
 */
type PrimaryDateParams = { from?: string; to?: string; preset?: string };

/**
 * Whether the primary date picker holds an edit the store has not taken yet.
 *
 * The comparison and interval controls commit on their own, so both ask this
 * first rather than committing a range draft along with their own change.
 *
 * @param applied - The window the widgets are querying with.
 * @param draft   - The window the picker is holding.
 * @return Whether the two describe a different window.
 */
export function hasPrimaryDateDraft(
	applied: PrimaryDateParams | undefined,
	draft: PrimaryDateParams | undefined
): boolean {
	return (
		applied?.from !== draft?.from || applied?.to !== draft?.to || applied?.preset !== draft?.preset
	);
}

/**
 * The subset of `REPORT_DATE_PARAM_KEYS` that carries the period-over-period
 * comparison.
 */
const COMPARISON_PARAM_KEYS = [ 'comp', 'compare_from', 'compare_to', 'compare_preset' ] as const;

/**
 * Drop the comparison params from a search object, keeping everything else.
 *
 * Detail pages have no period-over-period comparison by design. The params
 * stay in the URL so the breadcrumb round trip preserves the dashboard's
 * comparison state, but the page strips them from the `reportParams` it
 * injects into its widgets, so no widget can render comparison data — the
 * page-wide invariant holds by construction instead of relying on every
 * widget to ignore them.
 *
 * @param search - The current route search params.
 * @return A new object without the comparison params.
 */
export function omitComparisonReportParams(
	search: Record< string, unknown > | undefined
): Record< string, unknown > {
	if ( ! search ) {
		return {};
	}

	const stripped: Record< string, unknown > = { ...search };
	for ( const key of COMPARISON_PARAM_KEYS ) {
		delete stripped[ key ];
	}
	return stripped;
}

/**
 * Serialize one search value the way the router does.
 *
 * The router JSON-parses every search value on read, so a string that itself
 * parses as JSON (e.g. `comp: '1'`) must be written JSON-quoted (`comp="1"`)
 * or it comes back as a different type (`comp: 1`) and strict checks like
 * `comp === '1'` silently fail. Strings that don't parse (dates, presets)
 * stay raw, matching the router's own stringifier.
 *
 * @param value - The search value to serialize.
 * @return The querystring-ready value.
 */
function stringifySearchValue( value: unknown ): string {
	if ( typeof value === 'string' ) {
		try {
			JSON.parse( value );
			return JSON.stringify( value );
		} catch {
			return value;
		}
	}
	return String( value );
}

/**
 * Add the shared report-window querystring and any page-specific params to a path.
 *
 * @param path        - The path to link to.
 * @param search      - The current route search params.
 * @param extraParams - Optional destination-specific query params.
 * @return The path with its serialized querystring.
 */
function buildReportWindowLink(
	path: string,
	search: Record< string, unknown > | undefined,
	extraParams: Record< string, string > = {}
): string {
	const params = { ...pickReportDateParams( search ), ...extraParams };
	const query = new URLSearchParams(
		Object.entries( params ).map( ( [ key, value ] ) => [ key, stringifySearchValue( value ) ] )
	).toString();
	return query ? `${ path }?${ query }` : path;
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
	return buildReportWindowLink( '/', search );
}

/**
 * Build the `to` link to a report, preserving the shared report window.
 *
 * @param reportId - The report registry id.
 * @param search   - The current route search params.
 * @param section  - The referring report's validated section.
 * @return A report `to` path with the shared report-window querystring.
 */
export function buildReportLink(
	reportId: string,
	search: Record< string, unknown > | undefined,
	section?: string
): string {
	return buildReportWindowLink(
		`/reports/${ reportId }`,
		search,
		section ? { section } : undefined
	);
}
