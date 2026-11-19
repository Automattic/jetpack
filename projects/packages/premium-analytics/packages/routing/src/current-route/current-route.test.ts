import { DASHBOARD_PAGE_SLUG } from '../dashboard-href';
import { getCurrentRoutePath, onLocationChange } from './current-route';

const openUrl = ( search: string ): void => {
	window.history.replaceState( null, '', search );
};

// The router keeps the route in `p`, with its search params as a query string of its own.
const openRoute = ( route?: string ): void => {
	const p = route === undefined ? '' : `&p=${ encodeURIComponent( route ) }`;
	openUrl( `?page=${ DASHBOARD_PAGE_SLUG }${ p }` );
};

describe( 'getCurrentRoutePath', () => {
	afterEach( () => {
		openUrl( window.location.pathname );
	} );

	it.each< [ string, string | undefined, string ] >( [
		[ 'the dashboard, from a URL without a route', undefined, '/' ],
		[ 'the dashboard, without its search params', '/?section=traffic&from=2026-11-01', '/' ],
		[ 'a report, without its search params', '/reports/clicks?from=2026-11-01', '/reports/clicks' ],
	] )( 'reads %s', ( _case, route, path ) => {
		openRoute( route );

		expect( getCurrentRoutePath() ).toBe( path );
	} );

	// The admin shell runs this from other pages, some with a router of their own.
	it( 'reads no route from the URL of another page', () => {
		openUrl( '?page=jetpack-videopress&p=%2Flibrary' );

		expect( getCurrentRoutePath() ).toBeNull();
	} );
} );

describe( 'onLocationChange', () => {
	afterEach( () => {
		delete ( window as { navigation?: unknown } ).navigation;
	} );

	it( 'runs the listener when the URL changes', () => {
		// jsdom has no Navigation API.
		const navigation = new EventTarget();
		Object.defineProperty( window, 'navigation', { configurable: true, value: navigation } );
		const listener = jest.fn();

		onLocationChange( listener );
		navigation.dispatchEvent( new Event( 'currententrychange' ) );

		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'runs the listener when the admin shell shows a page', () => {
		const listener = jest.fn();

		onLocationChange( listener );
		window.dispatchEvent( new CustomEvent( 'jetpack-admin-shell:page-shown' ) );

		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );
} );
