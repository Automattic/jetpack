import { jest } from '@jest/globals';

const WATCHER_DATA = {
	cookieKey: 'agents_manager_chat_sidebar_open',
	// jsdom only returns cookies whose path matches the document URL ("/"),
	// so use a root path here rather than the real "/wp-admin".
	cookiePath: '/',
	sidebarOpenClass: 'agents-manager-sidebar-container--sidebar-open',
};

/**
 * Freshly (re)import the watcher module so its top-level "register on load"
 * side effect runs against the current document/window state.
 *
 * @return The imported module namespace.
 */
async function importWatcher() {
	jest.resetModules();
	return import( '../../src/js/sidebar-open-watcher' );
}

/**
 * Read a cookie value by key from document.cookie.
 *
 * @param key - Cookie name to read.
 * @return The cookie value, or undefined when absent/empty.
 */
function readCookie( key: string ): string | undefined {
	const match = document.cookie
		.split( '; ' )
		.map( pair => pair.split( '=' ) )
		.find( ( [ name ] ) => name === key );

	const value = match?.[ 1 ];
	return value ? value : undefined;
}

/**
 * Wait for the MutationObserver callback (a microtask) to flush.
 *
 * @return A promise that resolves once pending mutations have been observed.
 */
function flushMutations(): Promise< void > {
	return new Promise( resolve => setTimeout( resolve, 0 ) );
}

describe( 'registerSidebarOpenWatcher', () => {
	afterEach( () => {
		// Disconnect observers/pagehide listeners created during the test so
		// they cannot keep mutating the cookie across tests (the jsdom
		// document is shared for the whole file).
		window.dispatchEvent( new window.Event( 'pagehide' ) );

		delete window.AgentsManagerSidebarOpenWatcherData;
		document.body.className = '';
		document.cookie = `${ WATCHER_DATA.cookieKey }=; path=${ WATCHER_DATA.cookiePath }; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
	} );

	it( 'throws when the watcher data global is missing', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;
		const mod = await importWatcher();

		delete window.AgentsManagerSidebarOpenWatcherData;

		expect( () => mod.registerSidebarOpenWatcher() ).toThrow(
			'AgentsManagerSidebarOpenWatcherData is not defined'
		);
	} );

	it( 'sets the cookie to 1 on init when the sidebar-open class is present', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;
		document.body.classList.add( WATCHER_DATA.sidebarOpenClass );

		await importWatcher();

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBe( '1' );
	} );

	it( 'clears the cookie on init when the sidebar-open class is absent', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;
		// Seed an existing open cookie to prove it gets cleared.
		document.cookie = `${ WATCHER_DATA.cookieKey }=1; path=${ WATCHER_DATA.cookiePath }`;

		await importWatcher();

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();
	} );

	it( 'updates the cookie when the body class is added after init', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;

		await importWatcher();
		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();

		document.body.classList.add( WATCHER_DATA.sidebarOpenClass );
		await flushMutations();

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBe( '1' );
	} );

	it( 'clears the cookie when the body class is removed after init', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;
		document.body.classList.add( WATCHER_DATA.sidebarOpenClass );

		await importWatcher();
		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBe( '1' );

		document.body.classList.remove( WATCHER_DATA.sidebarOpenClass );
		await flushMutations();

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();
	} );

	it( 'stops syncing after the pagehide event disconnects the observer', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;

		await importWatcher();

		window.dispatchEvent( new window.Event( 'pagehide' ) );

		document.body.classList.add( WATCHER_DATA.sidebarOpenClass );
		await flushMutations();

		// Observer disconnected: the post-pagehide class change is ignored.
		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();
	} );
} );
