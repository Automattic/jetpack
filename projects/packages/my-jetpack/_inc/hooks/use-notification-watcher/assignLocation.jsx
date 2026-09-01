/* istanbul ignore file */ // This is intended to be mocked in tests, because we can't mock window.location.

/**
 * Wrapper to assign window.location.href
 *
 * So we can mock it in tests.
 *
 * @param {string} url - URL to assign.
 * @return {undefined}
 */
export function assignLocation( url ) {
	return ( window.location.href = url );
}
