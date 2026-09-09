import { LOCATION_CHANGE_EVENT } from '../../../../../../_inc/runtime-contract';
import { navigateTo, resolveRoute, settingsUrl, subpageHref, subpageUrl } from './routes';

const url = ( suffix: string ) =>
	`http://localhost/wp-admin/admin.php?page=jetpack-boost${ suffix }`;

describe( 'resolveRoute', () => {
	it.each( [ '', '#', '#/' ] )( 'treats %p as the Overview root', suffix => {
		expect( resolveRoute( url( suffix ) ).route ).toEqual( { subpage: null, tab: 'overview' } );
	} );

	it( 'reads the tab from the outer query', () => {
		expect( resolveRoute( url( '&tab=settings' ) ).route ).toEqual( {
			subpage: null,
			tab: 'settings',
		} );
	} );

	it( 'promotes a tab carried in the hash to the outer query', () => {
		const { route, normalizedUrl } = resolveRoute( url( '#/?tab=settings' ) );

		expect( route ).toEqual( { subpage: null, tab: 'settings' } );
		expect( normalizedUrl ).toBe( url( '&tab=settings' ) );
	} );

	it( 'parses the hash query before matching a sub-page', () => {
		expect( resolveRoute( url( '#/cache-debug-log?x=1' ) ).route.subpage ).toBe(
			'cache-debug-log'
		);
	} );

	it( 'lets a recognised hash win over the tab', () => {
		expect( resolveRoute( url( '&tab=settings#/critical-css-advanced' ) ).route.subpage ).toBe(
			'critical-css-advanced'
		);
	} );

	it( 'falls back to the root for an unrecognised hash', () => {
		expect( resolveRoute( url( '#/nope' ) ).route ).toEqual( { subpage: null, tab: 'overview' } );
	} );

	it( 'normalizes nothing for a plain URL', () => {
		expect( resolveRoute( url( '&tab=settings' ) ).normalizedUrl ).toBeNull();
	} );
} );

describe( 'settingsUrl', () => {
	it( 'clears the hash and sets the tab', () => {
		expect( settingsUrl( url( '#/cache-debug-log' ) ) ).toBe( url( '&tab=settings' ) );
	} );

	it( 'leaves an existing settings tab alone', () => {
		expect( settingsUrl( url( '&tab=settings' ) ) ).toBe( url( '&tab=settings' ) );
	} );
} );

describe( 'subpageUrl', () => {
	it( 'keeps the outer query', () => {
		expect( subpageUrl( 'getting-started', url( '&tab=settings' ) ) ).toBe(
			url( '&tab=settings#/getting-started' )
		);
	} );

	it( 'builds the same hash in both modes', () => {
		expect( subpageHref( 'purchase-successful' ) ).toBe( '#/purchase-successful' );
	} );
} );

describe( 'navigateTo', () => {
	const BASE = 'http://localhost/wp-admin/admin.php?page=jetpack-boost';

	beforeEach( () => {
		window.history.replaceState( null, '', BASE );
	} );

	it( 'pushes an entry and announces the change', () => {
		const listener = jest.fn();
		window.addEventListener( LOCATION_CHANGE_EVENT, listener );
		const before = window.history.length;

		navigateTo( `${ BASE }&tab=settings` );

		expect( window.location.search ).toContain( 'tab=settings' );
		expect( window.history ).toHaveLength( before + 1 );
		expect( listener ).toHaveBeenCalledTimes( 1 );

		window.removeEventListener( LOCATION_CHANGE_EVENT, listener );
	} );

	it( 'replaces the entry when asked, so a redirect leaves no history stop', () => {
		const before = window.history.length;

		navigateTo( `${ BASE }#/getting-started`, { replace: true } );

		expect( window.location.hash ).toBe( '#/getting-started' );
		expect( window.history ).toHaveLength( before );
	} );
} );
