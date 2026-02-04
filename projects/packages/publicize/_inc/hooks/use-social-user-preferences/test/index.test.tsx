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

	registry
		// @ts-expect-error register method exists
		.register( preferencesStore );

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
		expect( result.current.data.reviewPromptDismissed ).toBeUndefined();
	} );

	it( 'should return the initial preference values', () => {
		const registry = createRegistryWithPreferencesStore( {
			pre_publish_confirmation: true,
			review_prompt_dismissed: false,
		} );

		const { result } = renderHook( () => useSocialUserPreferences(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		expect( result.current.data.showPrePublishConfirmation ).toBe( true );
		expect( result.current.data.reviewPromptDismissed ).toBe( false );
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

		act( () => {
			result.current.set( 'reviewPromptDismissed', true );
		} );

		expect( result.current.data.reviewPromptDismissed ).toBe( true );
	} );

	it( 'should toggle a boolean preference value', () => {
		const registry = createRegistryWithPreferencesStore( {
			pre_publish_confirmation: false,
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
