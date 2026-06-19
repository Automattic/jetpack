const mockSetApiRoot = jest.fn();
const mockSetApiNonce = jest.fn();

/*
 * The connection store lives in the externalized shared-stores bundle, so it
 * owns its own copy of the `@automattic/jetpack-api` singleton. Mock it to
 * verify the store configures that copy (root + nonce) from the initial state;
 * without it the store's REST calls hit the default root and fail.
 */
jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { setApiRoot: mockSetApiRoot, setApiNonce: mockSetApiNonce },
} ) );

// Keep the test focused on api configuration, not @wordpress/data registration.
jest.mock( '../store-holder', () => ( {
	__esModule: true,
	default: { mayBeInit: jest.fn() },
} ) );

describe( 'connection store api configuration', () => {
	const originalState = window.JP_CONNECTION_INITIAL_STATE;

	afterEach( () => {
		window.JP_CONNECTION_INITIAL_STATE = originalState;
		mockSetApiRoot.mockClear();
		mockSetApiNonce.mockClear();
		jest.resetModules();
	} );

	it( 'points its api instance at the initial-state apiRoot and apiNonce', () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			apiRoot: 'https://example.com/wp-json/',
			apiNonce: 'test-nonce',
		};

		jest.isolateModules( () => {
			require( '../store' );
		} );

		expect( mockSetApiRoot ).toHaveBeenCalledWith( 'https://example.com/wp-json/' );
		expect( mockSetApiNonce ).toHaveBeenCalledWith( 'test-nonce' );
	} );

	it( 'does not configure the api instance when the initial state lacks them', () => {
		window.JP_CONNECTION_INITIAL_STATE = { connectionStatus: {} };

		jest.isolateModules( () => {
			require( '../store' );
		} );

		expect( mockSetApiRoot ).not.toHaveBeenCalled();
		expect( mockSetApiNonce ).not.toHaveBeenCalled();
	} );
} );
