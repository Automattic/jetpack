/**
 * Internal dependencies
 */
import { DASHBOARD_PAGE_SLUG } from '../dashboard-href';

/*
 * For now, the route on screen is read from the URL. `@wordpress/route` keeps the location of its
 * router private, so code outside of the routes has no other source.
 */

type NavigationEvents = {
	addEventListener: ( type: 'currententrychange', listener: () => void ) => void;
};

// Fired after each write to the history, in a browser that has no event of its own for it.
const HISTORY_WRITE_EVENT = 'jetpack-premium-analytics:history-write';

let isHistoryWrapped = false;

/**
 * Wrap the two methods that write to the history, once, so an event follows each write.
 */
function announceHistoryWrites(): void {
	if ( isHistoryWrapped ) {
		return;
	}

	isHistoryWrapped = true;

	for ( const method of [ 'pushState', 'replaceState' ] as const ) {
		const write = window.history[ method ];

		window.history[ method ] = ( ...args ) => {
			// A router calls it detached, so the history is named instead of taken from `this`.
			write.apply( window.history, args );
			window.dispatchEvent( new Event( HISTORY_WRITE_EVENT ) );
		};
	}
}

/**
 * The path of the route on screen, such as `/reports/clicks`, or `/` for the dashboard.
 *
 * @return The path, without the search params of the route, or `null` while another page is on screen.
 */
export function getCurrentRoutePath(): string | null {
	const search = new URLSearchParams( window.location.search );

	// The admin shell loads the dashboard ahead from another page and keeps it loaded afterwards,
	// so this also runs under the URL of that page, which would read as the route `/`.
	if ( search.get( 'page' ) !== DASHBOARD_PAGE_SLUG ) {
		return null;
	}

	// `@wordpress/boot` keeps the route in `p`, and has no option to rename it.
	const route = search.get( 'p' ) ?? '';

	// `p` holds the whole route: its path, then its search params as a query string of its own.
	const [ path ] = route.split( /[?#]/ );

	// Without `p`, the router is on `/`.
	return path || '/';
}

/**
 * Listen to the changes of the URL, which is where a change of route shows outside of the router.
 *
 * The listener also runs when only the search params change, so it compares what it reads. Without
 * the Navigation API it hears the writes to the history by wrapping them, as a router does.
 *
 * @param listener - Called after every change of the URL.
 */
export function onLocationChange( listener: () => void ): void {
	const navigation = ( window as { navigation?: NavigationEvents } ).navigation;

	if ( navigation ) {
		// The router changes the URL through the History API, which fires no event for it.
		navigation.addEventListener( 'currententrychange', listener );
	} else {
		// Without it, `popstate` tells of Back and Forward only, and nothing tells of a write.
		window.addEventListener( 'popstate', listener );
		announceHistoryWrites();
		window.addEventListener( HISTORY_WRITE_EVENT, listener );
	}

	// The admin shell tells when a page is on screen with its URL written, in every browser.
	window.addEventListener( 'jetpack-admin-shell:page-shown', listener );
}
