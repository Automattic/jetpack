import restApi from '@automattic/jetpack-api';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { act, renderHook } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import useConnectSite from '../index';

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: jest.fn(),
		setApiNonce: jest.fn(),
		registerSite: jest.fn(),
	},
} ) );
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

/**
 * Records every navigation the page attempts, since jsdom only logs them as "not implemented".
 *
 * @return The navigated URLs, in order.
 */
function recordNavigations(): string[] {
	const locationImpl = Object.getOwnPropertySymbols( window.location )
		.map( symbol => window.location[ symbol ] )
		.find( value => typeof value?._locationObjectNavigate === 'function' );
	const navigations: string[] = [];
	jest
		.spyOn( locationImpl, '_locationObjectNavigate' )
		.mockImplementation(
			( url: { scheme: string; host: string; path: string[]; query: string | null } ) => {
				navigations.push(
					`${ url.scheme }://${ url.host }/${ url.path.join( '/' ) }${
						url.query !== null ? '?' + url.query : ''
					}`
				);
			}
		);
	return navigations;
}

describe( 'useConnectSite', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( restApi.registerSite as jest.Mock ).mockResolvedValue( { authorizeUrl: 'x' } );
		// The connection store is shared, and each registration marks the site registered.
		(
			dispatch( CONNECTION_STORE_ID ) as { setConnectionStatus: ( status: object ) => void }
		 ).setConnectionStatus( { isRegistered: false } );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'navigates once, to checkout, with the My Jetpack return in its query', async () => {
		const navigations = recordNavigations();
		const { result } = renderHook( () =>
			useConnectSite( { tracksInfo: { event: 'jetpack_test', properties: {} } } )
		);

		await act( async () => {
			await result.current.connectSite( undefined );
		} );

		expect( navigations ).toHaveLength( 1 );
		expect( navigations[ 0 ] ).toContain( 'jetpack-my-jetpack-site-only-plans' );
		expect( navigations[ 0 ] ).toContain( 'redirect_to%3Dadmin.php%3Fpage%3Dmy-jetpack' );
	} );

	it.each( [
		[ undefined, 'my-jetpack' ],
		[ 'my_jetpack_products_backup', 'my_jetpack_products_backup' ],
	] )( 'registers the site with from=%s', async ( from, expected ) => {
		recordNavigations();
		const { result } = renderHook( () =>
			useConnectSite( { tracksInfo: { event: 'jetpack_test', properties: {} }, from } )
		);

		await act( async () => {
			await result.current.connectSite( undefined );
		} );

		expect( restApi.registerSite ).toHaveBeenCalledWith( null, '', expected );
	} );
} );
