/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { DEFAULT_GRID, normalizeGridSettings } from '@wordpress/widget-dashboard';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { PA_COLUMN_COUNT, PA_ROW_HEIGHT } from '../../../grid';
import { DASHBOARD_GRID_SETTINGS_KEY, DASHBOARD_PREFERENCES_SCOPE } from '../constants';
import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

// DEFAULT_GRID is the 2D grid model, so it carries `rowHeight`; keep the spread
// unannotated so the override type-checks against the grid variant rather than
// the `rowHeight`-less masonry member of the settings union.
const PA_DEFAULT_GRID = {
	...DEFAULT_GRID,
	columns: PA_COLUMN_COUNT,
	rowHeight: PA_ROW_HEIGHT,
};

/**
 * Hook for managing dashboard grid-settings preferences.
 *
 * Returns the persisted settings, a setter that writes through to the
 * preferences store, and a reset action that applies the bundled
 * defaults. The preference is shared across dashboards today; if a
 * per-dashboard split is needed later, the signature can grow a
 * dashboard-identifying parameter without touching call sites that
 * pass the dashboard's name through.
 *
 * @return Tuple `[ settings, setSettings, resetSettings ]`.
 */
export function useDashboardGridSettings(): [
	WidgetGridSettings,
	( settings: WidgetGridSettings ) => void,
	() => void,
] {
	const settings = useSelect( select => {
		const stored = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, name: string ) => WidgetGridSettings | undefined;
			}
		 ).get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_GRID_SETTINGS_KEY );
		return {
			...normalizeGridSettings( stored ?? PA_DEFAULT_GRID, PA_ROW_HEIGHT ),
			// Preferences written by the removed Columns control may still carry
			// another count, so pin it on read.
			columns: PA_COLUMN_COUNT,
		};
	}, [] );

	const { set } = useDispatch( preferencesStore ) as unknown as {
		set: ( scope: string, name: string, value: WidgetGridSettings | null ) => void;
	};

	/**
	 * Persists the grid settings, clearing the stored preference when the value
	 * matches the code default so the dashboard keeps tracking that default.
	 *
	 * @param next - Grid settings to persist.
	 */
	function setSettings( next: WidgetGridSettings ) {
		// Persist "back to default" as a cleared preference rather than a stored
		// copy of the defaults: the dashboard then tracks the current code
		// default and the value can never drift. Reset routes through here (the
		// drawer commit fires the setter with the default), so this is what makes
		// Reset + Save truly clear the stored preference.
		if ( fastDeepEqual( next, PA_DEFAULT_GRID ) ) {
			void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_GRID_SETTINGS_KEY, null );
			return;
		}
		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_GRID_SETTINGS_KEY, next );
	}

	/**
	 * Clears the stored grid settings preference, reverting to the code default.
	 */
	function resetSettings() {
		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_GRID_SETTINGS_KEY, null );
	}

	return [ settings, setSettings, resetSettings ];
}
