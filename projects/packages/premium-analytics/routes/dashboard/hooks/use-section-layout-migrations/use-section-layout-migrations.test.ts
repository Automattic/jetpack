/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import {
	DASHBOARD_LAYOUT_MIGRATIONS_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_SECTION_LAYOUTS_KEY,
} from '../constants';
import { useSectionLayoutMigrations } from './use-section-layout-migrations';
import type { DashboardSection } from '../../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const tags: DashboardWidget = { uuid: 'default-tags-widget-instance', type: 'jpa/tags' };
const widget = ( uuid: string ): DashboardWidget => ( { uuid, type: `jpa/${ uuid }` } );
const sections: DashboardSection[] = [
	{
		id: 'analytics/traffic',
		slug: 'traffic',
		label: 'Traffic',
		order: 0,
		default_layout: [ tags ],
	},
	{ id: 'analytics/insights', slug: 'insights', label: 'Insights', order: 1, default_layout: [] },
];

/**
 *
 * @param key
 */
/**
 * Read a dashboard preference.
 *
 * @param key - The preference key.
 * @return The stored value.
 */
function stored( key: string ): unknown {
	return (
		select( preferencesStore ) as unknown as { get: ( scope: string, key: string ) => unknown }
	 ).get( DASHBOARD_PREFERENCES_SCOPE, key );
}

describe( 'useSectionLayoutMigrations', () => {
	beforeEach( () => {
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY, {
			insights: [ widget( 'all-time-stats' ), tags ],
			traffic: [ widget( 'referrers' ) ],
		} );
		dispatch( preferencesStore ).set(
			DASHBOARD_PREFERENCES_SCOPE,
			DASHBOARD_LAYOUT_MIGRATIONS_KEY,
			[]
		);
	} );

	it( 'waits for the sections, then rewrites the stored layouts once and records it', () => {
		const { rerender } = renderHook(
			( { hasResolved } ) => useSectionLayoutMigrations( sections, hasResolved ),
			{ initialProps: { hasResolved: false } }
		);

		expect( stored( DASHBOARD_LAYOUT_MIGRATIONS_KEY ) ).toEqual( [] );

		rerender( { hasResolved: true } );

		expect( stored( DASHBOARD_SECTION_LAYOUTS_KEY ) ).toEqual( {
			insights: [ widget( 'all-time-stats' ) ],
			traffic: [ widget( 'referrers' ), tags ],
		} );
		expect( stored( DASHBOARD_LAYOUT_MIGRATIONS_KEY ) ).toEqual( [ 'tags-to-traffic' ] );
	} );

	it( 'leaves a layout the reader changed after the migration alone', () => {
		dispatch( preferencesStore ).set(
			DASHBOARD_PREFERENCES_SCOPE,
			DASHBOARD_LAYOUT_MIGRATIONS_KEY,
			[ 'tags-to-traffic' ]
		);
		const layouts = stored( DASHBOARD_SECTION_LAYOUTS_KEY );

		renderHook( () => useSectionLayoutMigrations( sections, true ) );

		expect( stored( DASHBOARD_SECTION_LAYOUTS_KEY ) ).toBe( layouts );
	} );
} );
