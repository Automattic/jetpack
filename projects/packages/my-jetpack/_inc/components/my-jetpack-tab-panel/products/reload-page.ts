/* istanbul ignore file */ // This is intended to be mocked in tests, because we can't mock window.location.

/**
 * Wrapper to reload the current page.
 *
 * Extracted so it can be mocked in tests.
 *
 * @return {undefined}
 */
export function reloadPage() {
	window.location.reload();
}
