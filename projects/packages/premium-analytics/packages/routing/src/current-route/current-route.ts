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
 * @return The path, without the search params of the route.
 */
export function getCurrentRoutePath(): string {
	// `@wordpress/boot` keeps the route in `p`, and has no option to rename it.
	const route = new URLSearchParams( window.location.search ).get( 'p' ) ?? '';

	// `p` holds the whole route: its path, then its search params as a query string of its own.
	const [ path ] = route.split( /[?#]/ );

	// Without `p`, the router is on `/`.
	return path || '/';
}

/**
 * Listen to the changes of the URL, which is where a change of route shows outside of the router.
 *
 * The listener also runs when only the search params change, so it compares what it reads. A
 * browser without the Navigation API never runs it, and the path read on load is all there is.
 *
 * @param listener - Called after every change of the URL.
 */
export function onLocationChange( listener: () => void ): void {
	// The router changes the URL through the History API, which fires no event for it.
	( window as { navigation?: NavigationEvents } ).navigation?.addEventListener(
		'currententrychange',
		listener
	);
}
