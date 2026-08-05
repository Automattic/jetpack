import { createReduxStore, register } from '@wordpress/data';
import { getPreloaded, SETTINGS_PATH } from './get-preloaded';
import type { SettingsResponse } from './settings-types';

/**
 * A tiny `@wordpress/data` store holding the latest-saved Settings snapshot.
 *
 * Each dashboard tab is its own `@wordpress/route` route, so the Settings stage
 * unmounts on tab switch and remounts on return. Seeding the form from the page
 * bootstrap alone meant a save (which only persists server-side) was invisible
 * on the next visit until a full reload re-fetched the bootstrap. This store
 * keeps the current snapshot — seeded once from the bootstrap, then replaced on
 * each successful save — so `useSettingsForm` re-seeds from the freshest values
 * across routes without a reload. Mirrors [coverage-store].
 */

const STORE_NAME = 'jetpack-seo/settings';

interface State {
	settings: SettingsResponse | null;
}

interface SetSettingsAction {
	type: 'SET_SETTINGS';
	settings: SettingsResponse;
}

const DEFAULT_STATE: State = {
	settings: getPreloaded< SettingsResponse >( SETTINGS_PATH ) ?? null,
};

const actions = {
	/**
	 * Replace the stored snapshot with the settings just persisted.
	 *
	 * @param settings - The latest-saved settings.
	 * @return The action.
	 */
	setSettings( settings: SettingsResponse ): SetSettingsAction {
		return { type: 'SET_SETTINGS', settings };
	},
};

const selectors = {
	/**
	 * The latest-known settings snapshot (or `null` when the bootstrap was absent).
	 *
	 * @param state - Store state.
	 * @return The settings.
	 */
	getSettings( state: State ): SettingsResponse | null {
		return state.settings;
	},
};

const store = createReduxStore( STORE_NAME, {
	reducer( state: State = DEFAULT_STATE, action: SetSettingsAction ): State {
		if ( action.type === 'SET_SETTINGS' ) {
			return { settings: action.settings };
		}
		return state;
	},
	actions,
	selectors,
} );

register( store );

export { store as settingsStore, STORE_NAME as SETTINGS_STORE_NAME };
