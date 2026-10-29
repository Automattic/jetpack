import { route } from './route';

jest.mock( '@wordpress/route', () => ( {
	redirect: ( options: object ) => ( { redirect: options } ),
} ) );

const thrownBy = ( run: () => void ) => {
	try {
		run();
	} catch ( error ) {
		return error;
	}
};

describe( 'dashboard route', () => {
	afterEach( () => window.history.replaceState( null, '', '/' ) );

	it.each( [
		[ '#/add-backup', '/add-backup' ],
		[ '#/add-protect/scan', '/add-protect/scan' ],
		[ '#/connection?skip_pricing=true', '/connection?skip_pricing=%22true%22' ],
		[ '#/features?search=1.0&feature=stats', '/features?search=%221.0%22&feature=stats' ],
	] )( 'replaces %s with its route', ( hash, href ) => {
		window.location.hash = hash;

		expect( thrownBy( route.beforeLoad ) ).toEqual( { redirect: { href, replace: true } } );
	} );

	it.each( [ '#wpbody-content', '#/', '#//example.com/x', '#/\\example.com/x' ] )(
		'leaves %p alone',
		hash => {
			window.location.hash = hash;

			expect( route.beforeLoad() ).toBeUndefined();
		}
	);

	it.each( [
		[ 'features', 'stats', true ],
		[ 'features', undefined, false ],
		[ 'overview', 'stats', false ],
	] )( 'on /%s with feature %p shows the inspector: %p', ( splat, feature, shown ) => {
		expect( route.inspector( { params: { _splat: splat }, search: { feature } } ) ).toBe( shown );
	} );
} );
