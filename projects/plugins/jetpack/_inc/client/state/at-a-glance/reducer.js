import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	STATS_SWITCH_TAB,
	STATS_DATA_FETCH,
	STATS_DATA_FETCH_FAIL,
	STATS_DATA_FETCH_SUCCESS,
	AKISMET_DATA_FETCH,
	AKISMET_DATA_FETCH_FAIL,
	AKISMET_DATA_FETCH_SUCCESS,
	AKISMET_KEY_CHECK_FETCH,
	AKISMET_KEY_CHECK_FETCH_FAIL,
	AKISMET_KEY_CHECK_FETCH_SUCCESS,
	VAULTPRESS_SITE_DATA_FETCH,
	VAULTPRESS_SITE_DATA_FETCH_FAIL,
	VAULTPRESS_SITE_DATA_FETCH_SUCCESS,
	DASHBOARD_PROTECT_COUNT_FETCH,
	DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
	DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS,
	PLUGIN_UPDATES_FETCH,
	PLUGIN_UPDATES_FETCH_FAIL,
	PLUGIN_UPDATES_FETCH_SUCCESS,
	MOCK_SWITCH_THREATS,
} from 'state/action-types';

const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case STATS_DATA_FETCH:
			return assign( {}, state, { fetchingStatsData: true } );
		case AKISMET_DATA_FETCH:
			return assign( {}, state, { fetchingAkismetData: true } );
		case AKISMET_KEY_CHECK_FETCH:
			return assign( {}, state, { checkingAkismetKey: true } );
		case VAULTPRESS_SITE_DATA_FETCH:
			return assign( {}, state, { fetchingVaultPressData: true } );
		case DASHBOARD_PROTECT_COUNT_FETCH:
			return assign( {}, state, { fetchingProtectData: true } );
		case PLUGIN_UPDATES_FETCH:
			return assign( {}, state, { fetchingPluginUpdates: true } );

		case STATS_DATA_FETCH_FAIL:
		case STATS_DATA_FETCH_SUCCESS:
			return assign( {}, state, { fetchingStatsData: false } );
		case AKISMET_DATA_FETCH_FAIL:
		case AKISMET_DATA_FETCH_SUCCESS:
			return assign( {}, state, { fetchingAkismetData: false } );
		case AKISMET_KEY_CHECK_FETCH_FAIL:
		case AKISMET_KEY_CHECK_FETCH_SUCCESS:
			return assign( {}, state, { checkingAkismetKey: false } );
		case DASHBOARD_PROTECT_COUNT_FETCH_FAIL:
		case DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS:
			return assign( {}, state, { fetchingProtectData: false } );
		case PLUGIN_UPDATES_FETCH_FAIL:
		case PLUGIN_UPDATES_FETCH_SUCCESS:
			return assign( {}, state, { fetchingPluginUpdates: false } );
		case VAULTPRESS_SITE_DATA_FETCH_FAIL:
		case VAULTPRESS_SITE_DATA_FETCH_SUCCESS:
			return assign( {}, state, { fetchingVaultPressData: false, hasLoadedVaultPressData: true } );

		default:
			return state;
	}
};

const activeStatsTab = ( state = 'day', action ) => {
	switch ( action.type ) {
		case STATS_SWITCH_TAB:
			return action.activeStatsTab;
		default:
			return state;
	}
};

const statsData = ( state = {}, action ) => {
	switch ( action.type ) {
		case STATS_DATA_FETCH_SUCCESS:
			return assign( {}, state, action.statsData );
		default:
			return state;
	}
};

const akismetData = ( state = 'N/A', action ) => {
	switch ( action.type ) {
		case AKISMET_DATA_FETCH_SUCCESS:
			return action.akismetData;
		default:
			return state;
	}
};

const akismet = (
	state = { validKey: null, invalidKeyCode: '', invalidKeyMessage: '' },
	action
) => {
	switch ( action.type ) {
		case AKISMET_KEY_CHECK_FETCH_SUCCESS:
			return assign( {}, state, action.akismet );
		default:
			return state;
	}
};

const protectCount = ( state = 'N/A', action ) => {
	switch ( action.type ) {
		case DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS:
			return action.protectCount;

		default:
			return state;
	}
};

const vaultPressData = ( state = 'N/A', action ) => {
	switch ( action.type ) {
		case VAULTPRESS_SITE_DATA_FETCH_SUCCESS:
			return action.vaultPressData;

		case MOCK_SWITCH_THREATS:
			return assign( {}, 'N/A' === state ? {} : state, {
				data: {
					active: true,
					features: {
						security: true,
					},
					security: {
						notice_count: action.mockCount,
					},
				},
			} );

		default:
			return state;
	}
};

const pluginUpdates = ( state = 'N/A', action ) => {
	switch ( action.type ) {
		case PLUGIN_UPDATES_FETCH_SUCCESS:
			return action.pluginUpdates;

		default:
			return state;
	}
};

export const dashboard = combineReducers( {
	requests,
	activeStatsTab,
	protectCount,
	vaultPressData,
	statsData,
	akismetData,
	akismet,
	pluginUpdates,
} );

/**
 * Returns string of active Stats tab in At A Glance section
 *
 * @param  {Object}  state -  Global state tree
 * @returns {string}         Which Stats tab is open.
 */
export function getActiveStatsTab( state ) {
	return state.jetpack.dashboard.activeStatsTab;
}

/**
 * Returns true if currently requesting Stats data.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {boolean}        Whether Stats data is being requested
 */
export function isFetchingStatsData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingStatsData;
}

/**
 * Returns object with Stats data.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {Object}			Stats data.
 */
export function getStatsData( state ) {
	return state.jetpack.dashboard.statsData;
}

/**
 * Returns true if currently requesting Akismet data
 *
 * @param  {Object}  state -  Global state tree
 * @returns {boolean}        Whether Akismet data is being requested
 */
export function isFetchingAkismetData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingAkismetData;
}

/**
 * Returns int of protect count of blocked attempts.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {int} Number of comments blocked by Akismet
 */
export function getAkismetData( state ) {
	return state.jetpack.dashboard.akismetData;
}

/**
 * Returns true if currently checking Akismet API key for validity.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {boolean}        Whether Akismet API key is being checked.
 */
export function isCheckingAkismetKey( state ) {
	return !! state.jetpack.dashboard.requests.checkingAkismetKey;
}

/**
 * Checks if the Akismet key is valid.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {boolean} True if Akismet API key is valid.
 */
export function isAkismetKeyValid( state ) {
	return get( state.jetpack.dashboard, [ 'akismet', 'validKey' ], false );
}

/**
 * Returns true if currently requesting Protect data
 *
 * @param  {Object}  state -  Global state tree
 * @returns {boolean}        Whether Protect data is being requested
 */
export function isFetchingProtectData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingProtectData;
}

/**
 * Returns int of protect count of blocked attempts.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {int} Number of blocked brute force login attempts
 */
export function getProtectCount( state ) {
	return state.jetpack.dashboard.protectCount;
}

/**
 * Returns true if a fetch to VaultPress data has completed.
 * Both success and error states will set hasLoadedVaultPressData = true.
 *
 * @param  {Object} state - Global state tree.
 * @returns {boolean} Whether a VaultPress data fetch has finished.
 */
export function hasLoadedVaultPressData( state ) {
	return !! state.jetpack.dashboard.requests.hasLoadedVaultPressData;
}

/**
 * Returns true if currently requesting VaultPress data
 *
 * @param  {Object}  state -  Global state tree
 * @returns {boolean}        Whether VaultPress data is being requested
 */
export function isFetchingVaultPressData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingVaultPressData;
}

/**
 *
 * Returns all VaultPress data as an object.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {Object} All VaultPress configuration/status data
 */
export function getVaultPressData( state ) {
	return state.jetpack.dashboard.vaultPressData;
}

/**
 *
 * Returns number of VaultPress Scan threats found.
 *
 * @param  {Object}  state -  Global state tree
 * @returns {int} The number of current security threats found by VaultPress
 */
export function getVaultPressScanThreatCount( state ) {
	return get( state.jetpack.dashboard.vaultPressData, 'data.security.notice_count', 0 );
}

/**
 * Returns true if currently requesting Plugin Updates
 *
 * @param  {Object}  state -  Global state tree
 * @returns {boolean}        Whether Plugin Updates are being requested
 */
export function isFetchingPluginUpdates( state ) {
	return !! state.jetpack.dashboard.requests.fetchingPluginUpdates;
}

/**
 * Returns int of plugin updates
 *
 * @param  {Object}  state -  Global state tree
 * @returns {int} Number of plugin updates currently available
 */
export function getPluginUpdates( state ) {
	return state.jetpack.dashboard.pluginUpdates;
}

/**
 * Returns true if currently requesting plugins data.
 *
 * @param  {object}  state -  Global state tree
 * @returns {boolean}        Whether plugins data is being requested
 */
export function isFetchingPluginsData( state ) {
	return !! state.jetpack.pluginsData.requests.isFetchingPluginsData;
}

/**
 * Returns the plugins data items object, with key being the plugin basepath
 * and value being an object containing plugin details
 *
 * @param  {object}  state -  Global state tree
 * @returns {object} The plugins data items
 */
export function getPluginItems( state ) {
	return state.jetpack.pluginsData.items || {};
}
