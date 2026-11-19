/**
 * Internal dependencies
 */
import { DASHBOARD_PAGE_SLUG } from '../dashboard-href';

/*
 * For now, the route on screen is read from the URL. `@wordpress/route` keeps the location of its
 * router private, so code outside of the routes has no other source. This is expected to change.
 */

type NavigationEvents = {
	addEventListener: ( type: 'currententrychange', listener: () => void ) => void;
};

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
 * The listener also runs when only the search params change, so it compares what it reads. A
 * browser without the Navigation API never runs it for a route, and the path read on load stays.
 *
 * @param listener - Called after every change of the URL.
 */
export function onLocationChange( listener: () => void ): void {
	// The router changes the URL through the History API, which fires no event for it.
	( window as { navigation?: NavigationEvents } ).navigation?.addEventListener(
		'currententrychange',
		listener
	);

	// The admin shell tells when a page is on screen with its URL written, in every browser.
	window.addEventListener( 'jetpack-admin-shell:page-shown', listener );
}
