import { getSubpage, resolveRoute, settingsUrl, subpageHref, subpageUrl } from './routes';

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

describe( 'getSubpage', () => {
	it( 'tolerates a trailing slash', () => {
		expect( getSubpage( '#/getting-started/' ) ).toBe( 'getting-started' );
	} );

	it( 'returns null for the root', () => {
		expect( getSubpage( '#/' ) ).toBeNull();
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
