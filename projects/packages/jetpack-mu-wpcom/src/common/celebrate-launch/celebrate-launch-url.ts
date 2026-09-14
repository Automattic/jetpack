/**
 * The query parameter that signals the post-launch celebration modal should show.
 */
export const CELEBRATE_LAUNCH_PARAM = 'celebrate-launch';

/**
 * Remove the celebrate-launch query parameter from a URL string.
 *
 * Accepts both absolute URLs (e.g. `window.location.href`) and relative paths
 * (e.g. a `_wp_http_referer` field value), and returns the same shape it was
 * given. When the parameter is absent the input string is returned untouched.
 *
 * @param {string} value - An absolute URL or a relative path, possibly carrying the param.
 * @return {string} The value with the celebrate-launch parameter removed.
 */
export function withoutCelebrateLaunchParam( value: string ): string {
	const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test( value );
	const url = new URL( value, isAbsolute ? undefined : 'http://placeholder.invalid' );

	if ( ! url.searchParams.has( CELEBRATE_LAUNCH_PARAM ) ) {
		return value;
	}

	url.searchParams.delete( CELEBRATE_LAUNCH_PARAM );

	return isAbsolute ? url.toString() : url.pathname + url.search + url.hash;
}
