/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from './constants';
import { useDashboardSectionLayout } from './use-dashboard-section-layout';
import type { DashboardSection } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const PREFERENCES_KEY = 'dashboardSectionLayouts';

/**
 * Build a minimal dashboard widget placement for layout fixtures.
 *
 * @param uuid - Unique instance identifier, reused to derive the type name.
 * @return A dashboard widget placement.
 */
function widget( uuid: string ): DashboardWidget {
	return { uuid, type: `jpa/${ uuid }` };
}

/**
 * Build a dashboard section carrying a default layout.
 *
 * @param slug          - Section slug, used as the preference key.
 * @param defaultLayout - The section's bundled default layout.
 * @return A dashboard section.
 */
function section( slug: string, defaultLayout: DashboardWidget[] ): DashboardSection {
	return {
		id: `analytics/${ slug }`,
		slug,
		label: slug,
		order: 0,
		default_layout: defaultLayout,
	};
}

/**
 * Read the persisted section layout map from the preferences store.
 *
 * @return The stored section layout map.
 */
function storedLayouts(): unknown {
	return (
		select( preferencesStore ) as unknown as {
			get: ( scope: string, key: string ) => unknown;
		}
	 ).get( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY );
}

describe( 'useDashboardSectionLayout', () => {
	const trafficDefault = [ widget( 'traffic-default' ) ];
	const storeDefault = [ widget( 'store-default' ) ];
	const sections = [ section( 'traffic', trafficDefault ), section( 'store', storeDefault ) ];

	beforeEach( () => {
		// The preferences store registers on the shared default registry, so
		// clear the key between tests.
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {} );
	} );

	it( 'removes only the active section entry on reset', () => {
		const trafficCustom = [ widget( 'traffic-custom' ) ];
		const storeCustom = [ widget( 'store-custom' ) ];
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
			traffic: trafficCustom,
			store: storeCustom,
		} );

		const { result } = renderHook( () => useDashboardSectionLayout( 'traffic', sections ) );

		act( () => result.current[ 2 ]() );

		expect( storedLayouts() ).toEqual( { store: storeCustom } );
	} );

	it( 'returns the entity default after a customize/reset round trip', () => {
		const { result } = renderHook( () => useDashboardSectionLayout( 'traffic', sections ) );

		act( () => result.current[ 1 ]( [ widget( 'traffic-custom' ) ] ) );
		expect( result.current[ 0 ] ).not.toBe( trafficDefault );

		act( () => result.current[ 2 ]() );

		expect( result.current[ 0 ] ).toBe( trafficDefault );
	} );

	it( 'keeps tracking the entity default after reset when the default changes', () => {
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
			traffic: [ widget( 'traffic-custom' ) ],
		} );

		const { result, rerender } = renderHook(
			( props: { sections: DashboardSection[] } ) =>
				useDashboardSectionLayout( 'traffic', props.sections ),
			{ initialProps: { sections } }
		);

		act( () => result.current[ 2 ]() );
		expect( result.current[ 0 ] ).toBe( trafficDefault );

		// A later release ships a different default for the section.
		const newTrafficDefault = [ widget( 'traffic-new-default' ) ];
		rerender( { sections: [ section( 'traffic', newTrafficDefault ), sections[ 1 ] ] } );

		expect( result.current[ 0 ] ).toBe( newTrafficDefault );
	} );

	it( 'does not write the preference when the section was never customized', () => {
		const stored = storedLayouts();

		const { result } = renderHook( () => useDashboardSectionLayout( 'traffic', sections ) );

		act( () => result.current[ 2 ]() );

		expect( storedLayouts() ).toBe( stored );
	} );
} );
