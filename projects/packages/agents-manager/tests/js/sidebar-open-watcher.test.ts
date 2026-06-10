import { jest } from '@jest/globals';

const WATCHER_DATA = {
	cookieKey: 'agents_manager_chat_sidebar_open_class_list',
	// jsdom only returns cookies whose path matches the document URL ("/"),
	// so use a root path here rather than the real "/wp-admin".
	cookiePath: '/',
	sidebarOpenClasses: [
		'agents-manager-sidebar-container',
		'agents-manager-sidebar-container--sidebar-open',
	],
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
 * Dispatch a sidebar open/close event to the watcher listener.
 *
 * @param detail           - Sidebar state carried on the custom event.
 * @param detail.isOpen    - Whether the sidebar is open.
 * @param detail.classList - Body classes to sync when the sidebar is open.
 */
function dispatchSidebarChange( detail: { isOpen: boolean; classList: string[] } ) {
	window.dispatchEvent( new CustomEvent( 'agentsManagerSidebarChange', { detail } ) );
}

describe( 'registerSidebarOpenWatcher', () => {
	afterEach( () => {
		// Remove listeners created during the test so they cannot keep mutating
		// the cookie across tests (the jsdom document is shared for the whole file).
		window.dispatchEvent( new window.Event( 'pagehide' ) );

		delete window.AgentsManagerSidebarOpenWatcherData;
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

	it( 'does not modify the cookie on init without a sidebar change event', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;
		document.cookie = `${ WATCHER_DATA.cookieKey }=${ WATCHER_DATA.sidebarOpenClasses.join(
			','
		) }; path=${ WATCHER_DATA.cookiePath }`;

		await importWatcher();

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBe(
			WATCHER_DATA.sidebarOpenClasses.join( ',' )
		);
	} );

	it( 'sets the cookie when the sidebar opens', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;

		await importWatcher();

		dispatchSidebarChange( {
			isOpen: true,
			classList: WATCHER_DATA.sidebarOpenClasses,
		} );

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBe(
			WATCHER_DATA.sidebarOpenClasses.join( ',' )
		);
	} );

	it( 'clears the cookie when the sidebar closes', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;
		document.cookie = `${ WATCHER_DATA.cookieKey }=${ WATCHER_DATA.sidebarOpenClasses.join(
			','
		) }; path=${ WATCHER_DATA.cookiePath }`;

		await importWatcher();

		dispatchSidebarChange( { isOpen: false, classList: WATCHER_DATA.sidebarOpenClasses } );

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();
	} );

	it( 'does not remove body classes when the sidebar closes', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;
		document.body.classList.add( ...WATCHER_DATA.sidebarOpenClasses );

		await importWatcher();

		dispatchSidebarChange( { isOpen: false, classList: WATCHER_DATA.sidebarOpenClasses } );

		// The watcher is cookie-only: live body classes are owned by the React
		// layout hook, so closing must not strip them here.
		expect( document.body ).toHaveClass( 'agents-manager-sidebar-container' );
		expect( document.body ).toHaveClass( 'agents-manager-sidebar-container--sidebar-open' );

		// Cleanup so the shared jsdom body doesn't leak into other tests.
		document.body.classList.remove( ...WATCHER_DATA.sidebarOpenClasses );
	} );

	it( 'updates the cookie when the sidebar opens after init', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;

		await importWatcher();
		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();

		dispatchSidebarChange( {
			isOpen: true,
			classList: WATCHER_DATA.sidebarOpenClasses,
		} );

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBe(
			WATCHER_DATA.sidebarOpenClasses.join( ',' )
		);
	} );

	it( 'clears the cookie when the sidebar closes after init', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;

		await importWatcher();

		dispatchSidebarChange( {
			isOpen: true,
			classList: WATCHER_DATA.sidebarOpenClasses,
		} );
		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBe(
			WATCHER_DATA.sidebarOpenClasses.join( ',' )
		);

		dispatchSidebarChange( { isOpen: false, classList: WATCHER_DATA.sidebarOpenClasses } );

		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();
	} );

	it( 'stops syncing after the pagehide event removes the listener', async () => {
		window.AgentsManagerSidebarOpenWatcherData = WATCHER_DATA;

		await importWatcher();

		window.dispatchEvent( new window.Event( 'pagehide' ) );

		dispatchSidebarChange( {
			isOpen: true,
			classList: WATCHER_DATA.sidebarOpenClasses,
		} );

		// Listener removed: the post-pagehide event is ignored.
		expect( readCookie( WATCHER_DATA.cookieKey ) ).toBeUndefined();
	} );
} );
