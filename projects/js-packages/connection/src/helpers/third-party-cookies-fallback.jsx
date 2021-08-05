/**
 * Performs the fallback redirect if third-party cookies are not available.
 *
 * @param {string} fallbackURL -- The fallback URL.
 */
const thirdPartyCookiesFallback = fallbackURL => {
	window.location.replace( fallbackURL );
};

export default thirdPartyCookiesFallback;
