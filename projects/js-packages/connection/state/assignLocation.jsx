/* istanbul ignore file */ // This is intended to be mocked in tests, because we can't mock window.location.

/**
 * Wrapper for window.location.assign
 *
 * So we can mock it in tests.
 *
 * @param {string} url - URL to assign.
 * @return {undefined}
 */
export function assignLocation( url ) {
	return window.location.assign( url );
}
