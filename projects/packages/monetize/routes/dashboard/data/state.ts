export interface MonetizeState {
	/** The site's slug, as WordPress.com addresses it. */
	siteSlug: string;
}

declare global {
	interface Window {
		jetpackMonetizeDashboard?: MonetizeState;
	}
}

/**
 * The state PHP printed onto the page.
 *
 * @return The state, or the admin's own host if the global is absent.
 */
export function getState(): MonetizeState {
	return window.jetpackMonetizeDashboard ?? { siteSlug: window.location.hostname };
}
