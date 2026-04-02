import { act, renderHook } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSocialUserPreferences } from '../';

const NAMESPACE = 'jetpack/social';

/**
 * Create a registry with the preferences store.
 *
 * @param {object} initialPreferences - Initial preferences to set.
 * @return Registry.
 */
function createRegistryWithPreferencesStore( initialPreferences = {} ) {
	const registry = createRegistry();

	registry.register( preferencesStore );

	// Set initial preferences if provided
	Object.entries( initialPreferences ).forEach( ( [ name, value ] ) => {
		registry.dispatch( preferencesStore ).set( NAMESPACE, name, value );
	} );

	return registry;
}

describe( 'useSocialUserPreferences', () => {
	it( 'should return undefined values by default', () => {
		const registry = createRegistryWithPreferencesStore();

		const { result } = renderHook( () => useSocialUserPreferences(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		expect( result.current.data.showPrePublishConfirmation ).toBeUndefined();
	} );

	it( 'should return the initial preference values', () => {
		const registry = createRegistryWithPreferencesStore( {
			show_pre_publish_confirmation: true,
		} );

		const { result } = renderHook( () => useSocialUserPreferences(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		expect( result.current.data.showPrePublishConfirmation ).toBe( true );
	} );

	it( 'should set a preference value', () => {
		const registry = createRegistryWithPreferencesStore();

		const { result } = renderHook( () => useSocialUserPreferences(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		act( () => {
			result.current.set( 'showPrePublishConfirmation', true );
		} );

		expect( result.current.data.showPrePublishConfirmation ).toBe( true );
	} );

	it( 'should toggle a boolean preference value', () => {
		const registry = createRegistryWithPreferencesStore( {
			show_pre_publish_confirmation: false,
		} );

		const { result } = renderHook( () => useSocialUserPreferences(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		expect( result.current.data.showPrePublishConfirmation ).toBe( false );

		act( () => {
			result.current.toggle( 'showPrePublishConfirmation' );
		} );

		expect( result.current.data.showPrePublishConfirmation ).toBe( true );

		act( () => {
			result.current.toggle( 'showPrePublishConfirmation' );
		} );

		expect( result.current.data.showPrePublishConfirmation ).toBe( false );
	} );
} );
