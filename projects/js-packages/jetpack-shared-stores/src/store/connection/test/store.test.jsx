const mockSetApiRoot = jest.fn();
const mockSetApiNonce = jest.fn();

/*
 * The connection store lives in the externalized shared-stores bundle, so it
 * owns its own copy of the `@automattic/jetpack-api` singleton. Mock it to
 * verify `initConnectionStore` configures that copy (root + nonce) from the
 * initial state; without it the store's REST calls hit the default root.
 */
jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { setApiRoot: mockSetApiRoot, setApiNonce: mockSetApiNonce },
} ) );

describe( 'initConnectionStore', () => {
	const originalState = window.JP_CONNECTION_INITIAL_STATE;

	afterEach( () => {
		window.JP_CONNECTION_INITIAL_STATE = originalState;
		mockSetApiRoot.mockClear();
		mockSetApiNonce.mockClear();
		jest.resetModules();
	} );

	it( 'registers the store only when initConnectionStore is called, not on import', () => {
		jest.isolateModules( () => {
			// Require @wordpress/data inside the isolated graph so it shares the
			// registry the store registers into.
			const { select } = require( '@wordpress/data' );
			const mod = require( '../index' );

			// The id resolves without registering anything.
			expect( mod.CONNECTION_STORE_ID ).toBe( 'jetpack-connection' );
			// Not registered on import: the store's selectors are unavailable.
			expect( select( mod.CONNECTION_STORE_ID )?.getConnectionStatus ).toBeUndefined();

			// Registered on init, and the selectors become available.
			const store = mod.initConnectionStore();
			expect( store.name ).toBe( 'jetpack-connection' );
			expect( select( mod.CONNECTION_STORE_ID ).getConnectionStatus ).toEqual(
				expect.any( Function )
			);
		} );
	} );

	it( 'returns the same store descriptor on repeated calls (idempotent)', () => {
		jest.isolateModules( () => {
			const { initConnectionStore } = require( '../index' );
			const first = initConnectionStore();
			const second = initConnectionStore();
			expect( first ).toBeDefined();
			expect( first ).toBe( second );
		} );
	} );

	it( 'points its api instance at the initial-state apiRoot and apiNonce', () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			apiRoot: 'https://example.com/wp-json/',
			apiNonce: 'test-nonce',
		};

		jest.isolateModules( () => {
			require( '../index' ).initConnectionStore();
		} );

		expect( mockSetApiRoot ).toHaveBeenCalledWith( 'https://example.com/wp-json/' );
		expect( mockSetApiNonce ).toHaveBeenCalledWith( 'test-nonce' );
	} );

	it( 'does not configure the api instance when the initial state lacks them', () => {
		window.JP_CONNECTION_INITIAL_STATE = { connectionStatus: {} };

		jest.isolateModules( () => {
			require( '../index' ).initConnectionStore();
		} );

		expect( mockSetApiRoot ).not.toHaveBeenCalled();
		expect( mockSetApiNonce ).not.toHaveBeenCalled();
	} );

	it( 'configures the api on a later call once initial state becomes available', () => {
		jest.isolateModules( () => {
			const { initConnectionStore } = require( '../index' );

			// First call before api config is available: nothing to configure.
			window.JP_CONNECTION_INITIAL_STATE = { connectionStatus: {} };
			initConnectionStore();
			expect( mockSetApiRoot ).not.toHaveBeenCalled();

			// A later call, once the data is present, still configures the api
			// even though the store was already registered.
			window.JP_CONNECTION_INITIAL_STATE = {
				apiRoot: 'https://example.com/wp-json/',
				apiNonce: 'test-nonce',
			};
			initConnectionStore();
			expect( mockSetApiRoot ).toHaveBeenCalledWith( 'https://example.com/wp-json/' );
			expect( mockSetApiNonce ).toHaveBeenCalledWith( 'test-nonce' );
		} );
	} );
} );
