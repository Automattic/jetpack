/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../src/hooks/use-config-value';
import { store as configStore, CONFIG_STORE } from '../../../src/store/config';

const mockConfigData = {
	isMailPoetEnabled: true,
	isIntegrationsEnabled: true,
	canInstallPlugins: false,
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

describe( 'useConfigValue', () => {
	let registry;
	let wrapper;

	beforeEach( () => {
		// Create a fresh registry for each test
		registry = createRegistry();
		registry.register( configStore );

		// Create wrapper component that provides the registry
		wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		);
	} );

	it( 'returns undefined when config is not loaded', () => {
		const { result } = renderHook( () => useConfigValue( 'isIntegrationsEnabled' ), { wrapper } );

		expect( result.current ).toBeUndefined();
	} );

	it( 'returns the correct value for a config key', () => {
		// Populate the store with config data
		registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

		const { result } = renderHook( () => useConfigValue( 'isIntegrationsEnabled' ), { wrapper } );

		expect( result.current ).toBe( true );
	} );

	it( 'returns boolean values correctly', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

		const { result: mailpoetResult } = renderHook( () => useConfigValue( 'isMailPoetEnabled' ), {
			wrapper,
		} );
		const { result: integrationsResult } = renderHook(
			() => useConfigValue( 'isIntegrationsEnabled' ),
			{ wrapper }
		);

		expect( mailpoetResult.current ).toBe( true );
		expect( integrationsResult.current ).toBe( true );
	} );

	it( 'returns string values correctly', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

		const { result: urlResult } = renderHook( () => useConfigValue( 'formsResponsesUrl' ), {
			wrapper,
		} );
		const { result: siteResult } = renderHook( () => useConfigValue( 'siteURL' ), { wrapper } );

		expect( urlResult.current ).toBe( 'https://example.com/wp-admin/edit.php?post_type=feedback' );
		expect( siteResult.current ).toBe( 'example.com' );
	} );

	it( 'returns number values correctly', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

		const { result: blogIdResult } = renderHook( () => useConfigValue( 'blogId' ), { wrapper } );
		const { result: trashResult } = renderHook( () => useConfigValue( 'emptyTrashDays' ), {
			wrapper,
		} );

		expect( blogIdResult.current ).toBe( 12345 );
		expect( trashResult.current ).toBe( 30 );
	} );

	it( 'returns undefined for non-existent keys', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( { isMailPoetEnabled: true } );

		const { result } = renderHook( () => useConfigValue( 'isIntegrationsEnabled' ), { wrapper } );

		expect( result.current ).toBeUndefined();
	} );

	it( 'updates when config value changes', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( { isIntegrationsEnabled: false } );

		const { result, rerender } = renderHook( () => useConfigValue( 'isIntegrationsEnabled' ), {
			wrapper,
		} );

		expect( result.current ).toBe( false );

		// Update the config
		act( () => {
			registry.dispatch( CONFIG_STORE ).receiveConfigValue( 'isIntegrationsEnabled', true );
		} );
		rerender();

		expect( result.current ).toBe( true );
	} );

	it( 'multiple hooks can read different config values', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

		const { result: isIntegrations } = renderHook(
			() => useConfigValue( 'isIntegrationsEnabled' ),
			{ wrapper }
		);
		const { result: blogId } = renderHook( () => useConfigValue( 'blogId' ), { wrapper } );
		const { result: isMailPoet } = renderHook( () => useConfigValue( 'isMailPoetEnabled' ), {
			wrapper,
		} );

		expect( isIntegrations.current ).toBe( true );
		expect( blogId.current ).toBe( 12345 );
		expect( isMailPoet.current ).toBe( true );
	} );

	it( 'returns undefined when config is invalidated', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

		const { result, rerender } = renderHook( () => useConfigValue( 'isIntegrationsEnabled' ), {
			wrapper,
		} );

		expect( result.current ).toBe( true );

		// Invalidate the config
		act( () => {
			registry.dispatch( CONFIG_STORE ).invalidateConfig();
		} );
		rerender();

		expect( result.current ).toBeUndefined();
	} );

	it( 'handles partial config objects', () => {
		// Only set a few config values
		registry.dispatch( CONFIG_STORE ).receiveConfig( {
			isMailPoetEnabled: true,
			isIntegrationsEnabled: false,
		} );

		const { result: mailpoetResult } = renderHook( () => useConfigValue( 'isMailPoetEnabled' ), {
			wrapper,
		} );
		const { result: integrationsResult } = renderHook(
			() => useConfigValue( 'isIntegrationsEnabled' ),
			{ wrapper }
		);
		const { result: blogIdResult } = renderHook( () => useConfigValue( 'blogId' ), { wrapper } );

		expect( mailpoetResult.current ).toBe( true );
		expect( integrationsResult.current ).toBe( false );
		expect( blogIdResult.current ).toBeUndefined();
	} );

	it( 'works with different config keys in the same component', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( mockConfigData );

		const { result: result1 } = renderHook( () => useConfigValue( 'isIntegrationsEnabled' ), {
			wrapper,
		} );
		const { result: result2 } = renderHook( () => useConfigValue( 'blogId' ), { wrapper } );
		const { result: result3 } = renderHook( () => useConfigValue( 'canInstallPlugins' ), {
			wrapper,
		} );

		expect( result1.current ).toBe( true );
		expect( result2.current ).toBe( 12345 );
		expect( result3.current ).toBe( false );
	} );

	it( 'handles empty config object', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( {} );

		const { result } = renderHook( () => useConfigValue( 'isIntegrationsEnabled' ), { wrapper } );

		expect( result.current ).toBeUndefined();
	} );
} );
