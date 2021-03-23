/**
 * Performs the fallback redirect if third-party cookies are not available.
 *
 * @param {string} fallbackUrl -- The fallback URL.
 */
const thirdPartyCookiesFallback = fallbackUrl => {
	window.location.replace( fallbackUrl );
};

export default thirdPartyCookiesFallback;
