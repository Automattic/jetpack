/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import assign from 'lodash/assign';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import {
	STATS_SWITCH_TAB,
	STATS_DATA_FETCH,
	STATS_DATA_FETCH_FAIL,
	STATS_DATA_FETCH_SUCCESS,
	AKISMET_DATA_FETCH,
	AKISMET_DATA_FETCH_FAIL,
	AKISMET_DATA_FETCH_SUCCESS,
	VAULTPRESS_SITE_DATA_FETCH,
	VAULTPRESS_SITE_DATA_FETCH_FAIL,
	VAULTPRESS_SITE_DATA_FETCH_SUCCESS,
	DASHBOARD_PROTECT_COUNT_FETCH,
	DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
	DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS,
	PLUGIN_UPDATES_FETCH,
	PLUGIN_UPDATES_FETCH_FAIL,
	PLUGIN_UPDATES_FETCH_SUCCESS
} from 'state/action-types';

const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case STATS_DATA_FETCH:
			return assign( {}, state, { fetchingStatsData: true } );
		case AKISMET_DATA_FETCH:
			return assign( {}, state, { fetchingAkismetData: true } );
		case VAULTPRESS_SITE_DATA_FETCH:
			return assign( {}, state, { fetchingVaultPressData: true } );
		case DASHBOARD_PROTECT_COUNT_FETCH:
			return assign( {}, state, { fetchingProtectData: true } );
		case PLUGIN_UPDATES_FETCH:
			return assign( {}, state, { fetchingPluginUpdates: true } );

		case STATS_DATA_FETCH_FAIL:
		case STATS_DATA_FETCH_SUCCESS:
		case AKISMET_DATA_FETCH_FAIL:
		case AKISMET_DATA_FETCH_SUCCESS:
		case VAULTPRESS_SITE_DATA_FETCH_FAIL:
		case VAULTPRESS_SITE_DATA_FETCH_SUCCESS:
		case DASHBOARD_PROTECT_COUNT_FETCH_FAIL:
		case DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS:
		case PLUGIN_UPDATES_FETCH_FAIL:
		case PLUGIN_UPDATES_FETCH_SUCCESS:
			return assign( {}, state, {
				fetchingStatsData: false,
				fetchingAkismetData: false,
				fetchingVaultPressData: false,
				fetchingProtectData: false,
				fetchingPluginUpdates: false
			} );

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

const statsData = ( state = 'N/A', action ) => {
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
	pluginUpdates
} );

/**
 * Returns string of active Stats tab in At A Glance section
 *
 * @param  {Object}  state  Global state tree
 * @return {String}         Which Stats tab is open.
 */
export function getActiveStatsTab( state ) {
	return state.jetpack.dashboard.activeStatsTab;
}

/**
 * Returns true if currently requesting Stats data.
 *
 * @param  {Object}  state  Global state tree
 * @return {Boolean}        Whether Stats data is being requested
 */
export function isFetchingStatsData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingStatsData;
}

/**
 * Returns object with Stats data.
 *
 * @param  {Object}  state  Global state tree
 * @return {Object}			Stats data.
 */
export function getStatsData( state ) {
	return state.jetpack.dashboard.statsData;
}

/**
 * Returns true if currently requesting Akismet data
 *
 * @param  {Object}  state  Global state tree
 * @return {Boolean}        Whether Akismet data is being requested
 */
export function isFetchingAkismetData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingAkismetData;
}

/**
 * Returns int of protect count of blocked attempts.
 *
 * @param  {Object}  state  Global state tree
 * @return {int} Number of comments blocked by Akismet
 */
export function getAkismetData( state ) {
	return state.jetpack.dashboard.akismetData;
}

/**
 * Returns true if currently requesting Protect data
 *
 * @param  {Object}  state  Global state tree
 * @return {Boolean}        Whether Protect data is being requested
 */
export function isFetchingProtectData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingProtectData;
}

/**
 * Returns int of protect count of blocked attempts.
 *
 * @param  {Object}  state  Global state tree
 * @return {int} Number of blocked brute force login attempts
 */
export function getProtectCount( state ) {
	return state.jetpack.dashboard.protectCount;
}

/**
 * Returns true if currently requesting VaultPress data
 *
 * @param  {Object}  state  Global state tree
 * @return {Boolean}        Whether VaultPress data is being requested
 */
export function isFetchingVaultPressData( state ) {
	return !! state.jetpack.dashboard.requests.fetchingVaultPressData;
}

/**
 *
 * Returns all VaultPress data as an object.
 *
 * @param  {Object}  state  Global state tree
 * @return {Object} All VaultPress configuration/status data
 */
export function getVaultPressData( state ) {
	return state.jetpack.dashboard.vaultPressData;
}

/**
 *
 * Returns number of VaultPress Scan threats found.
 *
 * @param  {Object}  state  Global state tree
 * @return {int} The number of current security threats found by VaultPress
 */
export function getVaultPressScanThreatCount( state ) {
	return get(
		state.jetpack.dashboard.vaultPressData,
		'data.security.notice_count',
		0
	);
}

/**
 * Returns true if currently requesting Plugin Updates
 *
 * @param  {Object}  state  Global state tree
 * @return {Boolean}        Whether Plugin Updates are being requested
 */
export function isFetchingPluginUpdates( state ) {
	return !! state.jetpack.dashboard.requests.fetchingPluginUpdates;
}

/**
 * Returns int of plugin updates
 *
 * @param  {Object}  state  Global state tree
 * @return {int} Number of plugin updates currently available
 */
export function getPluginUpdates( state ) {
	return state.jetpack.dashboard.pluginUpdates;
}
