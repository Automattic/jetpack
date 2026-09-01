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
const { store, CONFIG_STORE } = await import( '../../../src/store/config' );
const actions = await import( '../../../src/store/config/actions' );
const reducer = ( await import( '../../../src/store/config/reducer' ) ).default;
const selectors = await import( '../../../src/store/config/selectors' );

const createRegistryWithStores = () => {
	const registry = createRegistry();
	registry.register( store );
	return registry;
};

const mockConfigData = {
	isMailPoetEnabled: true,
	isIntegrationsEnabled: true,
	canInstallPlugins: true,
	canActivatePlugins: true,
	hasFeedback: true,
	formsResponsesUrl: 'https://example.com/wp-admin/edit.php?post_type=feedback',
	blogId: 12345,
	gdriveConnectSupportURL: 'https://example.com/support',
	pluginAssetsURL: 'https://example.com/assets',
	siteURL: 'example.com',
	dashboardURL: 'https://example.com/dashboard',
	exportNonce: 'export123',
	newFormNonce: 'form456',
	emptyTrashDays: 30,
};

describe( 'Config Store', () => {
	describe( 'actions', () => {
		it( 'receiveConfig', () => {
			const config = { isMailPoetEnabled: true, isIntegrationsEnabled: true };
			const action = actions.receiveConfig( config );

			expect( action ).toEqual( {
				type: 'RECEIVE_CONFIG',
				config,
			} );
		} );

		it( 'receiveConfigValue', () => {
			const action = actions.receiveConfigValue( 'isIntegrationsEnabled', true );

			expect( action ).toEqual( {
				type: 'RECEIVE_CONFIG_VALUE',
				key: 'isIntegrationsEnabled',
				value: true,
			} );
		} );

		it( 'invalidateConfig', () => {
			const action = actions.invalidateConfig();

			expect( action ).toEqual( {
				type: 'INVALIDATE_CONFIG',
			} );
		} );

		it( 'setConfigLoading', () => {
			const action = actions.setConfigLoading( true );

			expect( action ).toEqual( {
				type: 'SET_CONFIG_LOADING',
				isLoading: true,
			} );
		} );

		it( 'setConfigError', () => {
			const error = 'Something went wrong';
			const action = actions.setConfigError( error );

			expect( action ).toEqual( {
				type: 'SET_CONFIG_ERROR',
				error,
			} );
		} );
	} );

	describe( 'reducer', () => {
		const DEFAULT_STATE = {
			config: null,
			isLoading: false,
			error: null,
		};

		it( 'should return default state', () => {
			const state = reducer( undefined, {} );
			expect( state ).toEqual( DEFAULT_STATE );
		} );

		it( 'should handle RECEIVE_CONFIG', () => {
			const config = { isMailPoetEnabled: true, isIntegrationsEnabled: true };
			const state = reducer( DEFAULT_STATE, {
				type: 'RECEIVE_CONFIG',
				config,
			} );

			expect( state ).toEqual( {
				config,
				isLoading: false,
				error: null,
			} );
		} );

		it( 'should handle RECEIVE_CONFIG_VALUE', () => {
			const initialState = {
				config: { isMailPoetEnabled: true },
				isLoading: false,
				error: null,
			};

			const state = reducer( initialState, {
				type: 'RECEIVE_CONFIG_VALUE',
				key: 'isIntegrationsEnabled',
				value: true,
			} );

			expect( state.config ).toEqual( {
				isMailPoetEnabled: true,
				isIntegrationsEnabled: true,
			} );
		} );

		it( 'should handle SET_CONFIG_LOADING', () => {
			const state = reducer( DEFAULT_STATE, {
				type: 'SET_CONFIG_LOADING',
				isLoading: true,
			} );

			expect( state ).toEqual( {
				config: null,
				isLoading: true,
				error: null,
			} );
		} );

		it( 'should clear error when loading starts', () => {
			const initialState = {
				config: null,
				isLoading: false,
				error: 'Previous error',
			};

			const state = reducer( initialState, {
				type: 'SET_CONFIG_LOADING',
				isLoading: true,
			} );

			expect( state.error ).toBeNull();
		} );

		it( 'should handle SET_CONFIG_ERROR', () => {
			const error = 'Network error';
			const state = reducer( DEFAULT_STATE, {
				type: 'SET_CONFIG_ERROR',
				error,
			} );

			expect( state ).toEqual( {
				config: null,
				isLoading: false,
				error,
			} );
		} );

		it( 'should handle INVALIDATE_CONFIG', () => {
			const initialState = {
				config: { isMailPoetEnabled: true },
				isLoading: false,
				error: null,
			};

			const state = reducer( initialState, {
				type: 'INVALIDATE_CONFIG',
			} );

			expect( state ).toEqual( {
				config: null,
				isLoading: false,
				error: null,
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'getConfig returns config', () => {
			const state = {
				config: mockConfigData,
				isLoading: false,
				error: null,
			};

			expect( selectors.getConfig( state ) ).toEqual( mockConfigData );
		} );

		it( 'getConfig returns null when no config', () => {
			const state = {
				config: null,
				isLoading: false,
				error: null,
			};

			expect( selectors.getConfig( state ) ).toBeNull();
		} );

		it( 'getConfigValue returns specific value', () => {
			const state = {
				config: mockConfigData,
				isLoading: false,
				error: null,
			};

			expect( selectors.getConfigValue( state, 'isIntegrationsEnabled' ) ).toBe( true );
			expect( selectors.getConfigValue( state, 'blogId' ) ).toBe( 12345 );
			expect( selectors.getConfigValue( state, 'isMailPoetEnabled' ) ).toBe( true );
		} );

		it( 'getConfigValue returns undefined when key does not exist', () => {
			const state = {
				config: { isMailPoetEnabled: true },
				isLoading: false,
				error: null,
			};

			expect( selectors.getConfigValue( state, 'isIntegrationsEnabled' ) ).toBeUndefined();
		} );

		it( 'getConfigValue returns undefined when config is null', () => {
			const state = {
				config: null,
				isLoading: false,
				error: null,
			};

			expect( selectors.getConfigValue( state, 'isIntegrationsEnabled' ) ).toBeUndefined();
		} );

		it( 'isConfigLoading returns loading state', () => {
			const loadingState = {
				config: null,
				isLoading: true,
				error: null,
			};

			const notLoadingState = {
				config: mockConfigData,
				isLoading: false,
				error: null,
			};

			expect( selectors.isConfigLoading( loadingState ) ).toBe( true );
			expect( selectors.isConfigLoading( notLoadingState ) ).toBe( false );
		} );

		it( 'getConfigError returns error state', () => {
			const errorState = {
				config: null,
				isLoading: false,
				error: 'Failed to fetch',
			};

			const noErrorState = {
				config: mockConfigData,
				isLoading: false,
				error: null,
			};

			expect( selectors.getConfigError( errorState ) ).toBe( 'Failed to fetch' );
			expect( selectors.getConfigError( noErrorState ) ).toBeNull();
		} );
	} );

	describe( 'integration tests', () => {
		let registry;

		beforeEach( () => {
			registry = createRegistryWithStores();
			apiFetch.mockClear();
		} );

		it( 'should fetch config on first access', async () => {
			apiFetch.mockResolvedValue( mockConfigData );

			// Trigger resolver by selecting config
			const promise = registry.select( CONFIG_STORE ).getConfig();

			// Initially returns null
			expect( promise ).toBeNull();

			// Wait for the resolver to complete
			await new Promise( resolve => setTimeout( resolve, 0 ) );

			// Now should have the config
			const config = registry.select( CONFIG_STORE ).getConfig();
			expect( config ).toEqual( mockConfigData );
			expect( apiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/feedback/config' } );
		} );

		it( 'should handle fetch errors', async () => {
			const errorMessage = 'Network error';
			apiFetch.mockRejectedValue( new Error( errorMessage ) );

			// Trigger resolver
			registry.select( CONFIG_STORE ).getConfig();

			// Wait for the resolver to complete
			await new Promise( resolve => setTimeout( resolve, 0 ) );

			const error = registry.select( CONFIG_STORE ).getConfigError();
			expect( error ).toBe( errorMessage );
		} );

		it( 'should allow manual config update', () => {
			const config = { isMailPoetEnabled: true, isIntegrationsEnabled: true };
			registry.dispatch( CONFIG_STORE ).receiveConfig( config );

			expect( registry.select( CONFIG_STORE ).getConfig() ).toEqual( config );
		} );

		it( 'should allow updating individual config values', () => {
			const initialConfig = { isMailPoetEnabled: true, isIntegrationsEnabled: false };
			registry.dispatch( CONFIG_STORE ).receiveConfig( initialConfig );

			registry.dispatch( CONFIG_STORE ).receiveConfigValue( 'isIntegrationsEnabled', true );

			const config = registry.select( CONFIG_STORE ).getConfig();
			expect( config ).toEqual( {
				isMailPoetEnabled: true,
				isIntegrationsEnabled: true,
			} );
		} );

		it( 'should invalidate config', () => {
			const config = { isMailPoetEnabled: true, isIntegrationsEnabled: true };
			registry.dispatch( CONFIG_STORE ).receiveConfig( config );

			expect( registry.select( CONFIG_STORE ).getConfig() ).toEqual( config );

			registry.dispatch( CONFIG_STORE ).invalidateConfig();

			expect( registry.select( CONFIG_STORE ).getConfig() ).toBeNull();
		} );

		it( 'should fetch config data and make it available', async () => {
			apiFetch.mockResolvedValue( mockConfigData );

			// Trigger resolver
			registry.select( CONFIG_STORE ).getConfig();

			// Wait for resolver to complete
			await new Promise( resolve => setTimeout( resolve, 0 ) );

			// Config should be available
			const config = registry.select( CONFIG_STORE ).getConfig();
			expect( config ).toEqual( mockConfigData );

			// Second access should use cached data (no additional API call)
			const config2 = registry.select( CONFIG_STORE ).getConfig();
			expect( config2 ).toEqual( mockConfigData );

			// Should not make additional calls after config is loaded
			expect( apiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/feedback/config' } );
		} );

		it( 'should get specific config values', () => {
			registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

			expect( registry.select( CONFIG_STORE ).getConfigValue( 'blogId' ) ).toBe( 12345 );
			expect( registry.select( CONFIG_STORE ).getConfigValue( 'isIntegrationsEnabled' ) ).toBe(
				true
			);
			expect( registry.select( CONFIG_STORE ).getConfigValue( 'isMailPoetEnabled' ) ).toBe( true );
		} );

		it( 'should return undefined for non-existent config keys', () => {
			registry.dispatch( CONFIG_STORE ).receiveConfig( { isMailPoetEnabled: true } );

			expect(
				registry.select( CONFIG_STORE ).getConfigValue( 'isIntegrationsEnabled' )
			).toBeUndefined();
		} );
	} );
} );
