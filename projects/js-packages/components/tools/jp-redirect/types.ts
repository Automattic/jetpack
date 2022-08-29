export type GetRedirectUrlArgs = {
	/**
	 * URL of the current site. Will default to the value of
	 * jetpack_redirects.currentSiteRawUrl, if available.
	 * Used to fill in the `[site]` placeholder in the target.
	 */
	site?: string;

	/**
	 * Additional path to be appended to the URL.
	 * Used to fill in the `[path]` placeholder in the target.
	 */
	path?: string;

	/**
	 * Query parameters to be added to the final destination URL.
	 * Should be in query string format (e.g. 'key=value&foo=bar').
	 */
	query?: string;

	/**
	 * Anchor to be added to the URL. Must be a single string.
	 * Example: `section1`.
	 */
	anchor?: string;

	/**
	 * Any other custom arguments to be added to the final destination URL.
	 */
	[ key: string ]: string;
};

export type QueryVars = {
	url?: string;
	site?: string;
	source?: string;
	calypso_env?: string;
};

declare global {
	interface Window {
		Initial_State: {
			calypsoEnv?: string;
		};
	}
	const jetpack_redirects: {
		currentSiteRawUrl?: string;
	};
}
