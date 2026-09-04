import { act, renderHook } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { ROW_HEIGHT_PRESETS, WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import { DASHBOARD_GRID_SETTINGS_KEY, DASHBOARD_PREFERENCES_SCOPE } from '../constants';
import { useDashboardGridSettings } from './use-dashboard-grid-settings';

describe( 'useDashboardGridSettings', () => {
	beforeEach( () => {
		dispatch( preferencesStore ).set(
			DASHBOARD_PREFERENCES_SCOPE,
			DASHBOARD_GRID_SETTINGS_KEY,
			null
		);
	} );

	it( 'pins the column count whatever the stored preference says', () => {
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_GRID_SETTINGS_KEY, {
			model: 'grid',
			rowHeight: ROW_HEIGHT_PRESETS.medium,
			columns: 2,
		} );

		const { result } = renderHook( () => useDashboardGridSettings() );

		expect( result.current[ 0 ] ).toMatchObject( {
			columns: WIDGET_DASHBOARD_COLUMN_COUNT,
			rowHeight: ROW_HEIGHT_PRESETS.medium,
		} );
	} );

	it( 'keeps the pinned count after a write', () => {
		const { result } = renderHook( () => useDashboardGridSettings() );

		act( () =>
			result.current[ 1 ]( { model: 'grid', rowHeight: ROW_HEIGHT_PRESETS.large, columns: 1 } )
		);

		expect( result.current[ 0 ] ).toMatchObject( {
			columns: WIDGET_DASHBOARD_COLUMN_COUNT,
			rowHeight: ROW_HEIGHT_PRESETS.large,
		} );
	} );
} );
