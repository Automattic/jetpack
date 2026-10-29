import { route } from './route';

jest.mock( '@wordpress/route', () => ( {
	redirect: ( options: object ) => ( { redirect: options } ),
} ) );

describe( 'dashboard route', () => {
	afterEach( () => window.history.replaceState( null, '', '/' ) );

	it( 'replaces a `#/` link from before the boot router with its route', () => {
		window.location.hash = '#/connection?skip_pricing=true';

		let thrown: unknown;
		try {
			route.beforeLoad();
		} catch ( error ) {
			thrown = error;
		}

		expect( thrown ).toEqual( {
			redirect: { href: '/connection?skip_pricing=true', replace: true },
		} );
	} );

	it( 'leaves any other hash alone', () => {
		window.location.hash = '#wpbody-content';

		expect( route.beforeLoad() ).toBeUndefined();
	} );

	it.each( [
		[ 'features', 'stats', true ],
		[ 'features', undefined, false ],
		[ 'overview', 'stats', false ],
	] )( 'on /%s with feature %p shows the inspector: %p', ( splat, feature, shown ) => {
		expect( route.inspector( { params: { _splat: splat }, search: { feature } } ) ).toBe( shown );
	} );
} );
