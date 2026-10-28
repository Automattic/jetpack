/**
 * External dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';
import { createTZDateFromParts } from '@jetpack-premium-analytics/datetime';
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { useRememberAppliedPreset } from './use-remember-applied-preset';

type PreferencesSelectors = { get: ( scope: string, name: string ) => unknown };
type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

const remembered = ( name = 'datePreset' ) =>
	( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
		DASHBOARD_PREFERENCES_SCOPE,
		name
	);

const RANGE = {
	from: createTZDateFromParts( [ 2026, 0, 1 ], 'UTC' ),
	to: createTZDateFromParts( [ 2026, 0, 15 ], 'UTC' ),
};

describe( 'useRememberAppliedPreset', () => {
	afterEach( () => {
		( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
			DASHBOARD_PREFERENCES_SCOPE,
			'datePreset',
			undefined
		);
		( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
			DASHBOARD_PREFERENCES_SCOPE,
			'comparison',
			undefined
		);
	} );

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

		expect( remembered() ).toBe( 'last-30-days' );
		expect( set ).toHaveBeenCalledTimes( 1 );
		set.mockRestore();
	} );

	it.each( [
		[ 'a custom range', undefined ],
		[ 'a year', 'year-2024' ],
	] as const )( 'keeps the remembered preset when the reader applies %s', ( _label, presetId ) => {
		const { result } = renderHook( () => useRememberAppliedPreset() );

		act( () => {
			result.current.onChange( RANGE, 'last-30-days' );
			result.current.onApply();
			result.current.onChange( RANGE, presetId );
			result.current.onApply();
		} );

		expect( remembered() ).toBe( 'last-30-days' );
	} );

	it.each( [
		[ 'No comparison', undefined, undefined, 'none' ],
		[ 'a comparison preset', RANGE, 'previous-year', 'previous-year' ],
	] as const )( 'remembers %s', ( _label, range, presetId, expected ) => {
		const { result } = renderHook( () => useRememberAppliedPreset() );

		act( () => result.current.onComparisonChange( range, presetId ) );

		expect( remembered( 'comparison' ) ).toBe( expected );
	} );
} );
