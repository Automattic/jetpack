/**
 * The query parameters that signal the post-launch celebration modal should show.
 *
 * Calypso's launch flow returns to `back_to` with `celebrateLaunch`, the name its My Home uses.
 */
export const CELEBRATE_LAUNCH_PARAMS = [ 'celebrate-launch', 'celebrateLaunch' ] as const;

/**
 * Check whether a URL string carries any of the celebrate-launch query parameters.
 *
 * @param {string} value - An absolute URL, possibly carrying the param.
 * @return {boolean} Whether the celebration should show.
 */
export function hasCelebrateLaunchParam( value: string ): boolean {
	const { searchParams } = new URL( value );
	return CELEBRATE_LAUNCH_PARAMS.some( param => searchParams.has( param ) );
}

/**
 * Remove the celebrate-launch query parameters from a URL string.
 *
 * Accepts both absolute URLs (e.g. `window.location.href`) and relative paths
 * (e.g. a `_wp_http_referer` field value), and returns the same shape it was
 * given. When no parameter is present the input string is returned untouched.
 *
 * @param {string} value - An absolute URL or a relative path, possibly carrying the params.
 * @return {string} The value with the celebrate-launch parameters removed.
 */
export function withoutCelebrateLaunchParam( value: string ): string {
	const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test( value );
	const url = new URL( value, isAbsolute ? undefined : 'http://placeholder.invalid' );

	if ( ! CELEBRATE_LAUNCH_PARAMS.some( param => url.searchParams.has( param ) ) ) {
		return value;
	}

	CELEBRATE_LAUNCH_PARAMS.forEach( param => url.searchParams.delete( param ) );

	return isAbsolute ? url.toString() : url.pathname + url.search + url.hash;
}
