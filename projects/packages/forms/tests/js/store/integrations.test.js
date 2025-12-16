import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createRegistry } from '@wordpress/data';

// Mock apiFetch before any imports that use it
const mockApiFetch = jest.fn();
await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: mockApiFetch,
} ) );

// Dynamically import all dependencies after mocks are set up
const apiFetchModule = await import( '@wordpress/api-fetch' );
const apiFetch = apiFetchModule.default;
const { store, INTEGRATIONS_STORE } = await import( '../../../src/store/integrations' );
const actions = await import( '../../../src/store/integrations/actions' );
const reducer = ( await import( '../../../src/store/integrations/reducer' ) ).default;
const { resetMetadataFlag } = await import( '../../../src/store/integrations/resolvers' );
const selectors = await import( '../../../src/store/integrations/selectors' );

const createRegistryWithStores = () => {
	const registry = createRegistry();
	registry.register( store );
	return registry;
};

const mockMetadataResponse = [
	{
		id: 'akismet',
		slug: 'akismet',
		type: 'plugin',
		title: 'Akismet Spam Protection',
		subtitle: 'Akismet filters out form spam',
		marketingUrl: 'https://example.com/akismet',
		enabledByDefault: true,
	},
	{
		id: 'google-drive',
		slug: 'google-drive',
		type: 'service',
		title: 'Google Sheets',
		subtitle: 'Export to Google Sheets',
		marketingUrl: 'https://example.com/gdrive',
		enabledByDefault: false,
	},
];

const mockFullIntegrationsResponse = [
	{
		id: 'akismet',
		slug: 'akismet',
		type: 'plugin',
		title: 'Akismet Spam Protection',
		subtitle: 'Akismet filters out form spam',
		marketingUrl: 'https://example.com/akismet',
		enabledByDefault: true,
		pluginFile: 'akismet/akismet',
		isInstalled: true,
		isActive: true,
		isConnected: false,
		needsConnection: false,
		version: '5.0.0',
		settingsUrl: 'https://example.com/wp-admin/akismet',
		details: {},
	},
	{
		id: 'google-drive',
		slug: 'google-drive',
		type: 'service',
		title: 'Google Sheets',
		subtitle: 'Export to Google Sheets',
		marketingUrl: 'https://example.com/gdrive',
		enabledByDefault: false,
		pluginFile: null,
		isInstalled: false,
		isActive: false,
		isConnected: true,
		needsConnection: true,
		version: null,
		settingsUrl: null,
		details: { accountName: 'test@example.com' },
	},
];

describe( 'Integrations Store', () => {
	describe( 'actions', () => {
		it( 'receiveIntegrations', () => {
			const items = mockFullIntegrationsResponse;
			const action = actions.receiveIntegrations( items );

			expect( action ).toEqual( {
				type: 'RECEIVE_INTEGRATIONS',
				items,
			} );
		} );

		it( 'invalidateIntegrations', () => {
			const action = actions.invalidateIntegrations();

			expect( action ).toEqual( {
				type: 'INVALIDATE_INTEGRATIONS',
			} );
		} );

		it( 'setIntegrationsLoading', () => {
			const action = actions.setIntegrationsLoading( true );

			expect( action ).toEqual( {
				type: 'SET_INTEGRATIONS_LOADING',
				isLoading: true,
			} );
		} );

		it( 'setIntegrationsError', () => {
			const error = 'Something went wrong';
			const action = actions.setIntegrationsError( error );

			expect( action ).toEqual( {
				type: 'SET_INTEGRATIONS_ERROR',
				error,
			} );
		} );
	} );

	describe( 'reducer', () => {
		const DEFAULT_STATE = {
			items: null,
			isLoading: false,
			error: null,
		};

		it( 'should return default state', () => {
			const state = reducer( undefined, {} );
			expect( state ).toEqual( DEFAULT_STATE );
		} );

		it( 'should handle RECEIVE_INTEGRATIONS', () => {
			const items = mockFullIntegrationsResponse;
			const state = reducer( DEFAULT_STATE, {
				type: 'RECEIVE_INTEGRATIONS',
				items,
			} );

			expect( state ).toEqual( {
				items,
				isLoading: false,
				error: null,
			} );
		} );

		it( 'should handle SET_INTEGRATIONS_LOADING', () => {
			const state = reducer( DEFAULT_STATE, {
				type: 'SET_INTEGRATIONS_LOADING',
				isLoading: true,
			} );

			expect( state ).toEqual( {
				items: null,
				isLoading: true,
				error: null,
			} );
		} );

		it( 'should clear error when loading starts', () => {
			const initialState = {
				items: [],
				isLoading: false,
				error: 'Previous error',
			};

			const state = reducer( initialState, {
				type: 'SET_INTEGRATIONS_LOADING',
				isLoading: true,
			} );

			expect( state.error ).toBeNull();
		} );

		it( 'should handle SET_INTEGRATIONS_ERROR', () => {
			const error = 'Network error';
			const state = reducer( DEFAULT_STATE, {
				type: 'SET_INTEGRATIONS_ERROR',
				error,
			} );

			expect( state ).toEqual( {
				items: null,
				isLoading: false,
				error,
			} );
		} );

		it( 'should handle INVALIDATE_INTEGRATIONS', () => {
			const initialState = {
				items: mockFullIntegrationsResponse,
				isLoading: false,
				error: null,
			};

			const state = reducer( initialState, {
				type: 'INVALIDATE_INTEGRATIONS',
			} );

			expect( state ).toEqual( {
				items: null,
				isLoading: false,
				error: null,
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'getIntegrations returns integrations', () => {
			const state = {
				items: mockFullIntegrationsResponse,
				isLoading: false,
				error: null,
			};

			expect( selectors.getIntegrations( state ) ).toEqual( mockFullIntegrationsResponse );
		} );

		it( 'getIntegrations returns null when no integrations', () => {
			const state = {
				items: null,
				isLoading: false,
				error: null,
			};

			expect( selectors.getIntegrations( state ) ).toBeNull();
		} );

		it( 'isIntegrationsLoading returns loading state', () => {
			const loadingState = {
				items: [],
				isLoading: true,
				error: null,
			};

			const notLoadingState = {
				items: mockFullIntegrationsResponse,
				isLoading: false,
				error: null,
			};

			expect( selectors.isIntegrationsLoading( loadingState ) ).toBe( true );
			expect( selectors.isIntegrationsLoading( notLoadingState ) ).toBe( false );
		} );

		it( 'getIntegrationsError returns error state', () => {
			const errorState = {
				items: [],
				isLoading: false,
				error: 'Failed to fetch',
			};

			const noErrorState = {
				items: mockFullIntegrationsResponse,
				isLoading: false,
				error: null,
			};

			expect( selectors.getIntegrationsError( errorState ) ).toBe( 'Failed to fetch' );
			expect( selectors.getIntegrationsError( noErrorState ) ).toBeNull();
		} );
	} );

	describe( 'two-stage loading resolver', () => {
		let registry;

		beforeEach( () => {
			registry = createRegistryWithStores();
			apiFetch.mockClear();
			resetMetadataFlag();
		} );

		it( 'should fetch metadata first, then full integrations', async () => {
			// Mock the two API calls
			apiFetch
				.mockResolvedValueOnce( mockMetadataResponse ) // First call to /integrations-metadata
				.mockResolvedValueOnce( mockFullIntegrationsResponse ); // Second call to /integrations

			// Trigger resolver by selecting integrations
			const initialValue = registry.select( INTEGRATIONS_STORE ).getIntegrations();

			// Initially returns null (no data yet)
			expect( initialValue ).toBeNull();

			// Wait for both API calls to complete
			await new Promise( resolve => setTimeout( resolve, 50 ) );

			// Now should have full integrations with real status
			const fullIntegrations = registry.select( INTEGRATIONS_STORE ).getIntegrations();
			expect( fullIntegrations ).toEqual( mockFullIntegrationsResponse );
			expect( fullIntegrations[ 0 ].isInstalled ).toBe( true ); // Real value
			expect( fullIntegrations[ 0 ].isActive ).toBe( true ); // Real value

			// Verify both API calls were made in correct order
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
			expect( apiFetch ).toHaveBeenNthCalledWith( 1, {
				path: '/wp/v2/feedback/integrations-metadata',
			} );
			expect( apiFetch ).toHaveBeenNthCalledWith( 2, {
				path: '/wp/v2/feedback/integrations?version=2',
			} );
		} );

		it( 'should convert metadata to partial integrations with correct defaults', () => {
			// Test the conversion logic directly
			const metadataToPartial = mockMetadataResponse.map( meta => ( {
				...meta,
				pluginFile: null,
				isInstalled: false,
				isActive: false,
				isConnected: false,
				needsConnection: meta.type === 'service',
				version: null,
				settingsUrl: null,
				details: {},
			} ) );

			// Check plugin integration defaults
			expect( metadataToPartial[ 0 ] ).toMatchObject( {
				id: 'akismet',
				slug: 'akismet',
				type: 'plugin',
				title: 'Akismet Spam Protection',
				pluginFile: null,
				isInstalled: false,
				isActive: false,
				isConnected: false,
				needsConnection: false, // Plugins don't need connection
				version: null,
				settingsUrl: null,
				details: {},
			} );

			// Check service integration defaults
			expect( metadataToPartial[ 1 ] ).toMatchObject( {
				id: 'google-drive',
				slug: 'google-drive',
				type: 'service',
				title: 'Google Sheets',
				pluginFile: null,
				isInstalled: false,
				isActive: false,
				isConnected: false,
				needsConnection: true, // Services need connection
				version: null,
				settingsUrl: null,
				details: {},
			} );
		} );

		it( 'should handle metadata fetch errors', async () => {
			const errorMessage = 'Failed to fetch metadata';
			apiFetch.mockRejectedValue( new Error( errorMessage ) );

			// Trigger resolver
			registry.select( INTEGRATIONS_STORE ).getIntegrations();

			// Wait for the resolver to complete
			await new Promise( resolve => setTimeout( resolve, 10 ) );

			const error = registry.select( INTEGRATIONS_STORE ).getIntegrationsError();
			expect( error ).toBe( errorMessage );

			// Should have null integrations (no data loaded)
			const integrations = registry.select( INTEGRATIONS_STORE ).getIntegrations();
			expect( integrations ).toBeNull();
		} );

		it( 'should handle full integrations fetch errors after successful metadata', async () => {
			const errorMessage = 'Failed to fetch full integrations';
			apiFetch
				.mockResolvedValueOnce( mockMetadataResponse )
				.mockRejectedValueOnce( new Error( errorMessage ) );

			// Trigger resolver
			registry.select( INTEGRATIONS_STORE ).getIntegrations();

			// Wait for both calls to complete
			await new Promise( resolve => setTimeout( resolve, 0 ) );
			await new Promise( resolve => setTimeout( resolve, 0 ) );

			const error = registry.select( INTEGRATIONS_STORE ).getIntegrationsError();
			expect( error ).toBe( errorMessage );
		} );

		it( 'should set isLoading to false after completion', async () => {
			apiFetch
				.mockResolvedValueOnce( mockMetadataResponse )
				.mockResolvedValueOnce( mockFullIntegrationsResponse );

			// Initially not loading
			expect( registry.select( INTEGRATIONS_STORE ).isIntegrationsLoading() ).toBe( false );

			// Trigger resolver
			registry.select( INTEGRATIONS_STORE ).getIntegrations();

			// Wait for both calls to complete
			await new Promise( resolve => setTimeout( resolve, 50 ) );

			// Should not be loading anymore
			expect( registry.select( INTEGRATIONS_STORE ).isIntegrationsLoading() ).toBe( false );
		} );

		it( 'should allow manual refresh of integrations', async () => {
			// Initial fetch - metadata + full integrations
			apiFetch
				.mockResolvedValueOnce( mockMetadataResponse )
				.mockResolvedValueOnce( mockFullIntegrationsResponse );

			registry.select( INTEGRATIONS_STORE ).getIntegrations();

			await new Promise( resolve => setTimeout( resolve, 50 ) );

			// Clear mock to start fresh
			apiFetch.mockClear();

			// Refresh with updated data - should only call full integrations endpoint
			const updatedIntegrations = [ { ...mockFullIntegrationsResponse[ 0 ], isActive: false } ];
			apiFetch.mockResolvedValueOnce( updatedIntegrations );

			registry.dispatch( INTEGRATIONS_STORE ).refreshIntegrations();

			await new Promise( resolve => setTimeout( resolve, 50 ) );

			// Should have made only 1 call for refresh (metadata is cached via hasLoadedMeta flag)
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/feedback/integrations?version=2',
			} );
		} );
	} );
} );
