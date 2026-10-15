export interface InitialState {
	/** The site's domain, which Calypso and the WordPress.com APIs address it by. */
	domain: string;
}

declare global {
	interface Window {
		wpcomEarnInitialState?: InitialState;
	}
}

/**
 * Read the state PHP localized onto the page.
 *
 * @return The initial state, or the admin's own host if the global is absent.
 */
export function getInitialState(): InitialState {
	return window.wpcomEarnInitialState ?? { domain: window.location.hostname };
}
