/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { emitSurfaceEvent } from '../../../utils';
import { useTeaserSwitch } from '../use-teaser-switch';

jest.mock( '../../../utils', () => ( {
	emitSurfaceEvent: jest.fn(),
} ) );

const SCOPE = 'jetpack-announcements/whats-new';

const storedTeaserOff = () =>
	( select( preferencesStore ) as { get: ( ...args: unknown[] ) => unknown } ).get(
		SCOPE,
		'teaserOff'
	);

describe( 'useTeaserSwitch', () => {
	afterEach( () => {
		// The store's action answers a promise, which `act` must not be handed.
		act( () => {
			void ( dispatch( preferencesStore ) as { set: ( ...args: unknown[] ) => unknown } ).set(
				SCOPE,
				'teaserOff',
				undefined
			);
		} );
	} );

	it( 'is on until the user turns it off, and keeps the choice in the preferences', () => {
		const { result } = renderHook( () => useTeaserSwitch() );
		expect( result.current.isOn ).toBe( true );

		act( () => result.current.setIsOn( false ) );

		expect( result.current.isOn ).toBe( false );
		expect( storedTeaserOff() ).toBe( true );

		act( () => result.current.setIsOn( true ) );

		expect( result.current.isOn ).toBe( true );
		expect( storedTeaserOff() ).toBe( false );
	} );

	it( 'tells when the user changes it', () => {
		const { result } = renderHook( () => useTeaserSwitch() );

		act( () => result.current.setIsOn( false ) );

		expect( emitSurfaceEvent ).toHaveBeenCalledWith( { type: 'teaserSwitch', isOn: false } );
	} );
} );
