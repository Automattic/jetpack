declare global {
	interface Window {
		AgentsManagerSidebarOpenWatcherData?: {
			cookieKey: string;
			cookiePath: string;
			sidebarOpenClass: string;
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

	const { cookieKey, cookiePath, sidebarOpenClass } = window.AgentsManagerSidebarOpenWatcherData;

	/**
	 * Update the sidebar open cookie from the current body class.
	 */
	function syncSidebarOpenCookie() {
		const isOpen = document.body.classList.contains( sidebarOpenClass );

		if ( isOpen ) {
			document.cookie = `${ cookieKey }=1; path=${ cookiePath }; samesite=lax`;
		} else {
			document.cookie = `${ cookieKey }=; path=${ cookiePath }; samesite=lax`;
		}
	}

	const observer = new window.MutationObserver( function () {
		syncSidebarOpenCookie();
	} );

	observer.observe( document.body, {
		attributes: true,
		attributeFilter: [ 'class' ],
	} );

	syncSidebarOpenCookie();

	window.addEventListener( 'pagehide', function () {
		observer.disconnect();
	} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', registerSidebarOpenWatcher );
} else {
	registerSidebarOpenWatcher();
}

export { registerSidebarOpenWatcher };
