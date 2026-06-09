declare global {
	interface Window {
		AgentsManagerSidebarOpenWatcherData?: {
			cookieKey: string;
			cookiePath: string;
		};
	}
}

/**
 * Register the sidebar open watcher client script.
 *
 * Keeps the sidebar open cookie in sync with body classes so the next
 * full admin page load can pre-apply them server-side.
 */
function registerSidebarOpenWatcher() {
	if ( ! window.AgentsManagerSidebarOpenWatcherData ) {
		throw new Error( 'AgentsManagerSidebarOpenWatcherData is not defined' );
	}

	const { cookieKey, cookiePath } = window.AgentsManagerSidebarOpenWatcherData;

	/**
	 * Update the sidebar open cookie from the current body class.
	 * @param root0        - The custom event.
	 * @param root0.detail - Sidebar state: `{ isOpen: boolean, classList: string[] }`.
	 */
	function syncSidebarOpenCookie( {
		detail,
	}: CustomEvent< { isOpen: boolean; classList: string[] } > ) {
		if ( detail.isOpen ) {
			document.cookie = `${ cookieKey }=${ detail.classList.join(
				','
			) }; path=${ cookiePath }; samesite=lax`;
		} else {
			document.cookie = `${ cookieKey }=; path=${ cookiePath }; samesite=lax`;
			document.body.classList.remove( ...detail.classList );
		}
	}

	window.addEventListener( 'agentsManagerSidebarChange', syncSidebarOpenCookie );

	window.addEventListener( 'pagehide', function () {
		window.removeEventListener( 'agentsManagerSidebarChange', syncSidebarOpenCookie );
	} );
}

registerSidebarOpenWatcher();

export { registerSidebarOpenWatcher };
