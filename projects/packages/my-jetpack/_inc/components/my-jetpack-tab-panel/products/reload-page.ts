/* istanbul ignore file */ // This is intended to be mocked in tests, because we can't mock window.location.
import { getMyJetpackUrl } from '@automattic/jetpack-script-data';

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

/**
 * Wrapper to leave the app with a full page load to the My Jetpack overview page.
 *
 * Extracted so it can be mocked in tests.
 *
 * @return {undefined}
 */
export function loadMyJetpackHomePage() {
	window.location.href = getMyJetpackUrl();
}
