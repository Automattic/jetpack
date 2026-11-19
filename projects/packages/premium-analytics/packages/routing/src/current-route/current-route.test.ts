import { DASHBOARD_PAGE_SLUG } from '../dashboard-href';
import { getCurrentRoutePath, onLocationChange } from './current-route';

// The router keeps the route in `p`, with its search params as a query string of its own.
const openRoute = ( route?: string ): void => {
	const p = route === undefined ? '' : `&p=${ encodeURIComponent( route ) }`;
	window.history.replaceState( null, '', `?page=${ DASHBOARD_PAGE_SLUG }${ p }` );
};

describe( 'getCurrentRoutePath', () => {
	afterEach( () => {
		window.history.replaceState( null, '', window.location.pathname );
	} );

	it.each< [ string, string | undefined, string ] >( [
		[ 'the dashboard, from a URL without a route', undefined, '/' ],
		[ 'the dashboard, without its search params', '/?section=traffic&from=2026-11-01', '/' ],
		[ 'a report, without its search params', '/reports/clicks?from=2026-11-01', '/reports/clicks' ],
	] )( 'reads %s', ( _case, route, path ) => {
		openRoute( route );

		expect( getCurrentRoutePath() ).toBe( path );
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

	it( 'stays quiet in a browser without the Navigation API', () => {
		expect( () => onLocationChange( jest.fn() ) ).not.toThrow();
	} );
} );
