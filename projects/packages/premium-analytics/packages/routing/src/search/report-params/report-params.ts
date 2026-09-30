/**
 * External dependencies
 */
import { PRESET_ALL_TIME } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { DASHBOARD_ORIGIN_PARAM, pickDashboardOriginParams } from '../dashboard-origin';

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
 * Reads the page's own window, never page-scoped params like `post_id` or `section`.
 * A link out of a page that may be a detail page uses `pickReportNavigationParams()`
 * instead, which returns a detail page to the window it was opened from.
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
 * Prefix of the params a detail page keeps the linking page's window under, so
 * the page can open on its own range while its way back restores the original.
 */
const ORIGIN_WINDOW_PREFIX = 'ref_';

/**
 * Store the linking page's window under the origin-window params.
 *
 * An all-time window is dropped: the dashboard's range tabs and the reports
 * cannot name it, so the way back falls to the destination's default instead.
 *
 * @param search - The search params the detail page was linked with.
 * @return The origin-window params.
 */
export function toReportOriginWindowParams(
	search: Record< string, unknown > | undefined
): Record< string, unknown > {
	const linkedWindow = pickReportDateParams( search );
	if ( linkedWindow.preset === PRESET_ALL_TIME ) {
		return {};
	}

	return Object.fromEntries(
		Object.entries( linkedWindow ).map( ( [ key, value ] ) => [
			ORIGIN_WINDOW_PREFIX + key,
			value,
		] )
	);
}

/**
 * Pick the origin-window params out of a search object, still prefixed, so a
 * detail route that allowlists its params can keep them across a seed.
 *
 * @param search - The current route search params.
 * @return Only the origin-window params that are set.
 */
export function pickReportOriginWindowParams(
	search: Record< string, unknown > | undefined
): Record< string, unknown > {
	const picked: Record< string, unknown > = {};
	for ( const key of REPORT_DATE_PARAM_KEYS ) {
		const value = search?.[ ORIGIN_WINDOW_PREFIX + key ];
		if ( value !== undefined ) {
			picked[ ORIGIN_WINDOW_PREFIX + key ] = value;
		}
	}
	return picked;
}

/**
 * Pick the window a link out of the current page returns to: on a detail page
 * (scoped by `post_id`), the one it was opened from; elsewhere, the page's own.
 *
 * @param search - The current route search params.
 * @return The unprefixed report-window params to carry.
 */
function pickReturnDateParams(
	search: Record< string, unknown > | undefined
): Record< string, unknown > {
	if ( search?.post_id === undefined ) {
		return pickReportDateParams( search );
	}

	return Object.fromEntries(
		Object.entries( pickReportOriginWindowParams( search ) ).map( ( [ key, value ] ) => [
			key.slice( ORIGIN_WINDOW_PREFIX.length ),
			value,
		] )
	);
}

/**
 * Pick the params a link to another analytics route carries forward: the
 * report window to return to plus the dashboard tab.
 *
 * @param search - The current route search params.
 * @return A new object with the carried params that are set.
 */
export function pickReportNavigationParams(
	search: Record< string, unknown > | undefined
): Record< string, unknown > {
	return { ...pickReturnDateParams( search ), ...pickDashboardOriginParams( search ) };
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
 * Detail pages have no period-over-period comparison by design, so the page
 * strips these from the `reportParams` it injects into its widgets: the
 * invariant holds by construction instead of relying on every widget to
 * ignore them.
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
	const params = { ...pickReportNavigationParams( search ), ...extraParams };
	const query = new URLSearchParams(
		Object.entries( params ).map( ( [ key, value ] ) => [ key, stringifySearchValue( value ) ] )
	).toString();
	return query ? `${ path }?${ query }` : path;
}

/**
 * Build the `to` link back to the dashboard, preserving the shared report window.
 *
 * Serializes the date range and comparison into a querystring, and reopens the
 * dashboard tab the page was reached from, so returning restores the same view.
 * Page-scoped params are dropped.
 *
 * @param search - The current route search params.
 * @return A dashboard `to` path (e.g. `/?from=…&to=…`), or `/` when none are set.
 */
export function buildDashboardLink( search: Record< string, unknown > | undefined ): string {
	const { [ DASHBOARD_ORIGIN_PARAM ]: section } = pickDashboardOriginParams( search );
	return buildReportWindowLink( '/', pickReturnDateParams( search ), section ? { section } : {} );
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
