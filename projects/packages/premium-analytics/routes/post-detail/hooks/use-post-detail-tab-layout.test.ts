/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { usePostDetailTabLayout } from './use-post-detail-tab-layout';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const SCOPE = 'jetpack-premium-analytics/post-detail';
const KEY = 'tabLayouts';

/**
 * Build a fixed-composition widget for layout fixtures.
 *
 * @param uuid  - Unique instance identifier, reused to derive the type name.
 * @param order - Grid order for the placement.
 * @return A dashboard widget.
 */
function widget( uuid: string, order: number ): DashboardWidget {
	return {
		uuid,
		type: `jpa/${ uuid }`,
		attributes: { pinned: `fresh-${ uuid }` },
		placement: { width: 1, height: 2, order },
	};
}

/**
 * Read the persisted tab layout map from the preferences store.
 *
 * @return The stored tab layout map.
 */
function storedLayouts(): unknown {
	return (
		select( preferencesStore ) as unknown as {
			get: ( scope: string, key: string ) => unknown;
		}
	 ).get( SCOPE, KEY );
}

describe( 'usePostDetailTabLayout', () => {
	const fixed = [ widget( 'trend', 1 ), widget( 'countries', 2 ) ];

	beforeEach( () => {
		// The preferences store registers on the shared default registry, so
		// clear the key between tests.
		dispatch( preferencesStore ).set( SCOPE, KEY, {} );
	} );

	it( 'returns the fixed composition untouched without a stored arrangement', () => {
		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		expect( result.current.layout ).toBe( fixed );
		expect( result.current.hasCustomLayout ).toBe( false );
	} );

	it( 'stores membership and placement only, never attributes', () => {
		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		act( () =>
			result.current.setLayout( [
				{ ...fixed[ 1 ], placement: { width: 2, height: 2, order: 1 } },
				fixed[ 0 ],
			] )
		);

		expect( storedLayouts() ).toEqual( {
			'email-opens': [
				{ uuid: 'countries', placement: { width: 2, height: 2, order: 1 } },
				{ uuid: 'trend', placement: { width: 1, height: 2, order: 1 } },
			],
		} );
	} );

	it( 'reapplies the stored arrangement over fresh fixed attributes', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			'email-opens': [
				{ uuid: 'countries', placement: { width: 2, height: 2, order: 1 } },
				{ uuid: 'trend' },
			],
		} );

		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		expect( result.current.hasCustomLayout ).toBe( true );
		expect( result.current.layout ).toEqual( [
			// Stored order and placement win; type and attributes come from the
			// fixed composition, so injected params can never go stale.
			{ ...fixed[ 1 ], placement: { width: 2, height: 2, order: 1 } },
			fixed[ 0 ],
		] );
	} );

	it( 'drops a stored card the composition no longer ships', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			'email-opens': [ { uuid: 'retired-card' }, { uuid: 'trend' } ],
		} );

		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		expect( result.current.layout ).toEqual( [ fixed[ 0 ] ] );
	} );

	it( 'keeps a card removed from the arrangement removed', () => {
		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		act( () => result.current.setLayout( [ fixed[ 0 ] ] ) );

		expect( result.current.layout ).toEqual( [ fixed[ 0 ] ] );
	} );

	it( 'scopes the arrangement to the active tab', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			'email-clicks': [ { uuid: 'countries' } ],
		} );

		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		expect( result.current.layout ).toBe( fixed );
	} );

	it( 'removes only the active tab entry on reset and follows the composition again', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			'email-opens': [ { uuid: 'trend' } ],
			'post-traffic': [ { uuid: 'countries' } ],
		} );

		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		act( () => result.current.resetLayout() );

		expect( storedLayouts() ).toEqual( { 'post-traffic': [ { uuid: 'countries' } ] } );
		expect( result.current.layout ).toBe( fixed );
		expect( result.current.hasCustomLayout ).toBe( false );
	} );

	it( 'ignores a stored value that is not a tab-layouts map', () => {
		dispatch( preferencesStore ).set(
			SCOPE,
			KEY,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[ 'not', 'a', 'map' ] as any
		);

		const { result } = renderHook( () => usePostDetailTabLayout( 'email-opens', fixed ) );

		expect( result.current.layout ).toBe( fixed );
	} );
} );
