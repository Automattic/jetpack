import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const registerSite = jest.fn< () => Promise< unknown > >();
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { setApiRoot: jest.fn(), setApiNonce: jest.fn() },
} ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	__esModule: true,
	useDispatch: () => ( { registerSite } ),
	useSelect: () => undefined,
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.unstable_mockModule( '../../../components/use-connection', () => ( {
	__esModule: true,
	default: () => ( {
		isUserConnected: false,
		isRegistered: false,
		handleConnectUser: jest.fn(),
	} ),
} ) );
jest.unstable_mockModule( '../../../helpers/get-calypso-origin', () => ( {
	__esModule: true,
	default: () => 'https://wordpress.com/',
} ) );
jest.unstable_mockModule( '../../../state/store.jsx', () => ( {
	__esModule: true,
	STORE_ID: 'jetpack-connection',
} ) );

const useProductCheckoutWorkflow = ( await import( '../index' ) ).default;

const props = {
	productSlug: 'jetpack_backup_t1_yearly',
	redirectUrl: 'https://example.org/wp-admin/',
	siteSuffix: 'example.org',
	adminUrl: 'https://example.org/wp-admin/',
	from: 'my-jetpack',
};

describe( 'useProductCheckoutWorkflow', () => {
	it( 'stops the busy state and reports the error when site registration fails', async () => {
		registerSite.mockRejectedValue( new Error( 'Registration failed' ) );
		const { result } = renderHook( () => useProductCheckoutWorkflow( props ) );

		await act( async () => {
			await result.current.run();
		} );

		expect( result.current.hasCheckoutStarted ).toBe( false );
		expect( result.current.checkoutError ).toBe( 'Registration failed' );
	} );

	it( 'stops the busy state and reports the error when the product lookup fails', async () => {
		registerSite.mockResolvedValue( {} );
		const siteProductAvailabilityHandler = jest.fn< () => Promise< boolean > >();
		siteProductAvailabilityHandler.mockRejectedValue( new Error( 'Lookup failed' ) );
		const { result } = renderHook( () =>
			useProductCheckoutWorkflow( { ...props, siteProductAvailabilityHandler } )
		);

		await act( async () => {
			await result.current.run();
		} );

		expect( result.current.hasCheckoutStarted ).toBe( false );
		expect( result.current.checkoutError ).toBe( 'Lookup failed' );
	} );
} );
