/**
 * Reload the dashboard so it re-renders from the server.
 *
 * A wrapper because `window.location` can't be mocked directly in jsdom.
 */
export function reloadDashboard() {
	window.location.reload();
}
