/**
 * Search param naming the dashboard tab a report or detail page was opened
 * from, so the Stats breadcrumb returns to it. Kept apart from `section`, which
 * report and detail pages use for their own tabs.
 */
export const DASHBOARD_ORIGIN_PARAM = 'ds';

/**
 * Pick the dashboard origin out of a search object.
 *
 * The value is untrusted; the dashboard resolves an unknown tab to its default.
 *
 * @param search - The current route search params.
 * @return The dashboard origin param, when one is set.
 */
export function pickDashboardOriginParams(
	search: Record< string, unknown > | undefined
): Record< string, string > {
	const section = search?.[ DASHBOARD_ORIGIN_PARAM ];
	return typeof section === 'string' && section ? { [ DASHBOARD_ORIGIN_PARAM ]: section } : {};
}
