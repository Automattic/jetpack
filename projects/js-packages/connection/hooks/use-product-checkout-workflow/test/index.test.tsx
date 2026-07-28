import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const useConnection = jest.fn();
jest.unstable_mockModule( '../../../components/use-connection', () => ( {
	__esModule: true,
	default: useConnection,
} ) );

const registerSite = jest.fn();
jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( { registerSite } ),
	useSelect: selector => selector( () => ( { getBlogId: () => null } ) ),
} ) );

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { setApiRoot: jest.fn(), setApiNonce: jest.fn() },
} ) );

jest.unstable_mockModule( '../../../state/store.jsx', () => ( {
	STORE_ID: 'jetpack-connection-test-store',
} ) );

const { default: useProductCheckoutWorkflow } = await import( '../index' );

// `@wordpress/jest-console` augments the global jest matchers at runtime, but
// the package typecheck doesn't pick up its types — declare the one we use.
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		interface Matchers< R > {
			toHaveErrored(): R;
		}
	}
}

const handleConnectUser = jest.fn();

// Site already owns the product being purchased, so `handleAfterRegistration` skips
// checkout -- this is the branch that decides whether an already-linked user gets
// bounced through WP.com re-authorization or just sent on their way.
describe( 'useProductCheckoutWorkflow: site already has the product', () => {
	afterEach( () => jest.clearAllMocks() );

	it( 'redirects directly instead of re-authorizing a user who is already connected', async () => {
		useConnection.mockReturnValue( {
			isRegistered: true,
			isUserConnected: true,
			handleConnectUser,
		} );

		const { result } = renderHook( () =>
			useProductCheckoutWorkflow( {
				productSlug: 'jetpack_search',
				redirectUrl: 'https://example.com/wp-admin/admin.php?page=jetpack-search',
				siteSuffix: 'example.com',
				from: 'jetpack-search',
				siteProductAvailabilityHandler: () => Promise.resolve( true ),
			} )
		);

		// jsdom doesn't implement cross-origin navigation: the `window.location.href`
		// assignment logs a "Not implemented: navigation" console error rather than
		// throwing or changing the URL. `toHaveErrored()` acknowledges that expected
		// error; `handleConnectUser` not being called is the real signal that this took
		// the direct-redirect branch instead of the re-authorize branch.
		await act( () => result.current.run() );

		expect( handleConnectUser ).not.toHaveBeenCalled();
		expect( console ).toHaveErrored();
	} );

	it( 'still connects the user when they are not yet linked', async () => {
		useConnection.mockReturnValue( {
			isRegistered: true,
			isUserConnected: false,
			hasConnectedOwner: false,
			handleConnectUser,
		} );

		const { result } = renderHook( () =>
			useProductCheckoutWorkflow( {
				productSlug: 'jetpack_search',
				redirectUrl: 'https://example.com/wp-admin/admin.php?page=jetpack-search',
				siteSuffix: 'example.com',
				from: 'jetpack-search',
				siteProductAvailabilityHandler: () => Promise.resolve( true ),
			} )
		);

		await act( () => result.current.run() );

		expect( handleConnectUser ).toHaveBeenCalledTimes( 1 );
	} );
} );
