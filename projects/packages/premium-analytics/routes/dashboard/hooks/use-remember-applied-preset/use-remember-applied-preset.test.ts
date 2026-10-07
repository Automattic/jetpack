/**
 * External dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { useRememberAppliedPreset } from './use-remember-applied-preset';

type PreferencesSelectors = { get: ( scope: string, name: string ) => unknown };
type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

const remembered = () =>
	( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
		DASHBOARD_PREFERENCES_SCOPE,
		'datePreset'
	);

const RANGE = { from: new Date( '2026-01-01' ), to: new Date( '2026-01-15' ) };

describe( 'useRememberAppliedPreset', () => {
	afterEach( () => {
		( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
			DASHBOARD_PREFERENCES_SCOPE,
			'datePreset',
			undefined
		);
	} );

	it( 'remembers a preset staged and applied in the same tick', () => {
		const { result } = renderHook( () => useRememberAppliedPreset() );

		act( () => {
			result.current.onChange( RANGE, 'last-30-days' );
			result.current.onApply();
		} );

		expect( remembered() ).toBe( 'last-30-days' );
	} );

	// Every preferences set saves to the server.
	it( 'does not save again when the reader re-applies the remembered preset', () => {
		const actions = dispatch( preferencesStore ) as unknown as PreferencesActions;
		const set = jest.spyOn( actions, 'set' );
		const { result } = renderHook( () => useRememberAppliedPreset() );

		act( () => {
			result.current.onChange( RANGE, 'last-30-days' );
			result.current.onApply();
			result.current.onChange( RANGE, 'last-30-days' );
			result.current.onApply();
		} );

		expect( set ).toHaveBeenCalledTimes( 1 );
		set.mockRestore();
	} );

	it.each( [
		[ 'a custom range', undefined ],
		[ 'a year', 'year-2024' ],
	] )( 'keeps the remembered preset when the reader applies %s', ( _label, presetId ) => {
		const { result } = renderHook( () => useRememberAppliedPreset() );

		act( () => {
			result.current.onChange( RANGE, 'last-30-days' );
			result.current.onApply();
			result.current.onChange( RANGE, presetId as never );
			result.current.onApply();
		} );

		expect( remembered() ).toBe( 'last-30-days' );
	} );
} );
