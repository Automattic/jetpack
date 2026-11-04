import restApi from '@automattic/jetpack-api';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { act, renderHook } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import { leavePageFor } from '../../../utils/reload-page';
import useConnectSite from '../index';

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: jest.fn(),
		setApiNonce: jest.fn(),
		registerSite: jest.fn(),
	},
} ) );
jest.mock( '../../../utils/reload-page' );
jest.mock( '../../../data/products/use-products-by-ownership', () => ( {
	__esModule: true,
	default: () => ( { refetch: jest.fn() } ),
} ) );
jest.mock( '../../use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {
		siteSuffix: 'example.org',
		adminUrl: 'http://example.org/wp-admin/',
		myJetpackCheckoutUri: 'admin.php?page=my-jetpack',
		topJetpackMenuItemUrl: '',
		blogID: '1',
	} ),
	getMyJetpackWindowRestState: () => ( { apiRoot: 'http://example.org/wp-json/', apiNonce: 'n' } ),
	getMyJetpackWindowConnectionState: () => ( { registrationNonce: 'r' } ),
} ) );

describe( 'useConnectSite', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( restApi.registerSite as jest.Mock ).mockResolvedValue( { authorizeUrl: 'x' } );
		// The connection store is shared, and each registration marks the site registered.
		(
			dispatch( CONNECTION_STORE_ID ) as { setConnectionStatus: ( status: object ) => void }
		 ).setConnectionStatus( { isRegistered: false } );
	} );

	it( 'leaves for checkout, with the My Jetpack return in its query', async () => {
		const { result } = renderHook( () =>
			useConnectSite( { tracksInfo: { event: 'jetpack_test', properties: {} } } )
		);

		await act( async () => {
			await result.current.connectSite( undefined );
		} );

		expect( leavePageFor ).toHaveBeenCalledTimes( 1 );
		expect( leavePageFor ).toHaveBeenCalledWith(
			expect.stringContaining( 'jetpack-my-jetpack-site-only-plans' )
		);
		expect( leavePageFor ).toHaveBeenCalledWith(
			expect.stringContaining( 'redirect_to%3Dadmin.php%3Fpage%3Dmy-jetpack' )
		);
	} );

	it.each( [
		[ undefined, 'my-jetpack' ],
		[ 'my_jetpack_products_backup', 'my_jetpack_products_backup' ],
	] )( 'registers the site with from=%s', async ( from, expected ) => {
		const { result } = renderHook( () =>
			useConnectSite( { tracksInfo: { event: 'jetpack_test', properties: {} }, from } )
		);

		await act( async () => {
			await result.current.connectSite( undefined );
		} );

		expect( restApi.registerSite ).toHaveBeenCalledWith( null, '', expected );
	} );
} );
