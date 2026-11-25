import { DASHBOARD_PAGE_SLUG } from '../dashboard-href';
import { getCurrentRoutePath } from './current-route';

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
	let onLocationChange: ( listener: () => void ) => void;

	beforeEach( async () => {
		// Loaded again without its imports: a second copy of those evaluates Yjs twice, which logs an error.
		jest.resetModules();
		jest.doMock( '../dashboard-href', () => ( { DASHBOARD_PAGE_SLUG } ) );
		( { onLocationChange } = await import( './current-route' ) );
	} );

	afterEach( () => {
		delete ( window as { navigation?: unknown } ).navigation;

		for ( const method of [ 'pushState', 'replaceState' ] ) {
			Reflect.deleteProperty( window.history, method );
		}
	} );

	it( 'leaves the history alone where the Navigation API tells of its writes', () => {
		Object.defineProperty( window, 'navigation', { configurable: true, value: new EventTarget() } );

		onLocationChange( jest.fn() );

		// The two methods live on the prototype, so a wrap shows as a property of the history itself.
		expect( Object.getOwnPropertyNames( window.history ) ).toEqual( [] );
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

	it.each< [ string, () => void ] >( [
		[
			'the admin shell shows a page',
			() => window.dispatchEvent( new Event( 'jetpack-admin-shell:page-shown' ) ),
		],
		[ 'the user goes back or forward', () => window.dispatchEvent( new Event( 'popstate' ) ) ],
		[ 'a router opens a route', () => window.history.pushState( null, '', window.location.href ) ],
		[
			'a router rewrites the URL',
			() => window.history.replaceState( null, '', window.location.href ),
		],
	] )( 'runs the listener when %s', ( _case, change ) => {
		const listener = jest.fn();

		onLocationChange( listener );
		change();

		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );
} );
