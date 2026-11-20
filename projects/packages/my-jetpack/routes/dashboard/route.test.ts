import { isSettingsConsolidationEnabled } from '../../_inc/utils/settings-consolidation';
import { route } from './route';

jest.mock( '../../_inc/utils/settings-consolidation' );

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
		[ 'is on and a feature is named', true, { configure: 'carousel' }, true ],
		[ 'is off, whatever the URL says', false, { configure: 'carousel' }, false ],
		[ 'is on and no feature is named', true, { view: 'list' }, false ],
		[ 'is on and the name is empty', true, { configure: '' }, false ],
	] )( 'opens the inspector when settings consolidation %s', ( _name, enabled, search, shown ) => {
		jest.mocked( isSettingsConsolidationEnabled ).mockReturnValue( enabled );

		expect( route.inspector( { search } ) ).toBe( shown );
	} );
} );
