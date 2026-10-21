import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useStoredDetailLayout } from '../use-stored-detail-layout';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const SCOPE = 'jetpack-premium-analytics/post-detail';
const KEY = 'layouts';

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
 * Read the persisted layouts map from the preferences store.
 *
 * @return The stored layouts map.
 */
function storedLayouts(): unknown {
	return (
		select( preferencesStore ) as unknown as {
			get: ( scope: string, key: string ) => unknown;
		}
	 ).get( SCOPE, KEY );
}

describe( 'useStoredDetailLayout', () => {
	const fixed = [ widget( 'trend', 1 ), widget( 'countries', 2 ) ];

	beforeEach( () => {
		// The preferences store registers on the shared default registry, so
		// clear the key between tests.
		dispatch( preferencesStore ).set( SCOPE, KEY, {} );
	} );

	it( 'returns the fixed composition untouched without a stored arrangement', () => {
		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

		expect( result.current.layout ).toBe( fixed );
		expect( result.current.hasCustomLayout ).toBe( false );
	} );

	it( 'stores membership and placement only, never attributes', () => {
		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

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

		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

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

		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

		expect( result.current.layout ).toEqual( [ fixed[ 0 ] ] );
	} );

	it( 'keeps a card removed from the arrangement removed', () => {
		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

		act( () => result.current.setLayout( [ fixed[ 0 ] ] ) );

		expect( result.current.layout ).toEqual( [ fixed[ 0 ] ] );
	} );

	it( 'scopes the arrangement to the layout id', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			'email-clicks': [ { uuid: 'countries' } ],
		} );

		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

		expect( result.current.layout ).toBe( fixed );
	} );

	it( 'keeps routes apart through their preferences scope', () => {
		dispatch( preferencesStore ).set( 'jetpack-premium-analytics/video-detail', KEY, {
			video: [ { uuid: 'countries' } ],
		} );

		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'video', fixed ) );

		expect( result.current.layout ).toBe( fixed );
	} );

	it( 'removes only the active entry on reset and follows the composition again', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			'email-opens': [ { uuid: 'trend' } ],
			'post-traffic': [ { uuid: 'countries' } ],
		} );

		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

		act( () => result.current.resetLayout() );

		expect( storedLayouts() ).toEqual( { 'post-traffic': [ { uuid: 'countries' } ] } );
		expect( result.current.layout ).toEqual( fixed );
		expect( result.current.hasCustomLayout ).toBe( false );
	} );

	it( 'stores only the attributes the reader changed, never the injected params', () => {
		const pinned = fixed.map( card => ( {
			...card,
			attributes: {
				...( card.attributes as Record< string, unknown > ),
				reportParams: { from: '2026-06-22' },
			},
		} ) );
		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', pinned ) );

		act( () =>
			result.current.setLayout( [
				{
					...pinned[ 0 ],
					attributes: { ...pinned[ 0 ].attributes, chartType: 'bar' },
				},
				pinned[ 1 ],
			] )
		);

		expect( storedLayouts() ).toEqual( {
			'email-opens': [
				{
					uuid: 'trend',
					placement: { width: 1, height: 2, order: 1 },
					attributes: { chartType: 'bar' },
				},
				{ uuid: 'countries', placement: { width: 1, height: 2, order: 2 } },
			],
		} );
	} );

	it( 'reapplies changed attributes under the composition’s injected params', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, {
			'email-opens': [ { uuid: 'trend', attributes: { chartType: 'bar', pinned: 'stale' } } ],
		} );
		const pinned = [
			{
				...fixed[ 0 ],
				attributes: {
					...( fixed[ 0 ].attributes as Record< string, unknown > ),
					reportParams: { from: '2026-06-22' },
				},
			},
		];

		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', pinned ) );

		expect( result.current.layout[ 0 ].attributes ).toEqual( {
			pinned: 'stale',
			chartType: 'bar',
			reportParams: { from: '2026-06-22' },
		} );
	} );

	it( 'hands the dashboard a fresh committed layout on reset even with nothing stored', () => {
		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );
		const before = result.current.layout;

		// The dashboard rebuilds its staged edits only when the committed layout
		// changes identity, so a reset that stores nothing must still change it.
		act( () => result.current.resetLayout() );

		expect( result.current.layout ).not.toBe( before );
		expect( result.current.layout ).toEqual( fixed );
		expect( storedLayouts() ).toEqual( {} );
	} );

	it( 'ignores a stored value that is not a layouts map', () => {
		dispatch( preferencesStore ).set( SCOPE, KEY, [ 'not', 'a', 'map' ] as unknown as never );

		const { result } = renderHook( () => useStoredDetailLayout( SCOPE, 'email-opens', fixed ) );

		expect( result.current.layout ).toBe( fixed );
	} );
} );
