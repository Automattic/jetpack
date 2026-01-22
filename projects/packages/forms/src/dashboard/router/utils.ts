/**
 * Custom event name for URL changes within the dashboard.
 * Uses a custom event to avoid conflicts with browser navigation popstate events.
 */
export const DASHBOARD_URL_CHANGE_EVENT = 'jetpack-forms-url-change';

/**
 * Pattern to extract view from URL pathname.
 * Matches paths like /responses/inbox, /marketing/forms/spam, /forms/trash
 */
export const VIEW_PATTERN = /(?:\/responses\/|\/marketing\/forms\/|\/forms\/)([^/?#]+)/;

/**
 * Check if we're in an external admin context (e.g., params embedded in ?p= parameter).
 *
 * @return True if in external admin context.
 */
export function isExternalAdminContext(): boolean {
	const url = new URL( window.location.href );
	return url.searchParams.has( 'p' );
}

/**
 * Get effective pathname, checking for external admin ?p= parameter.
 *
 * @return The effective pathname.
 */
export function getEffectivePathname(): string {
	const url = new URL( window.location.href );
	return url.searchParams.get( 'p' ) || url.pathname;
}

/**
 * Extract view parameter from URL pathname.
 *
 * @return The view parameter (inbox, spam, or trash).
 */
export function getViewFromUrl(): string {
	const pathname = getEffectivePathname();
	const match = pathname.match( VIEW_PATTERN );
	return match?.[ 1 ] || 'inbox';
}
