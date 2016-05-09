/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import assign from 'lodash/assign';

/**
 * Internal dependencies
 */
import {
	AKISMET_DATA_FETCH,
	AKISMET_DATA_FETCH_FAIL,
	AKISMET_DATA_FETCH_SUCCESS,
	MONITOR_LAST_DOWNTIME_FETCH,
	MONITOR_LAST_DOWNTIME_FETCH_FAIL,
	MONITOR_LAST_DOWNTIME_FETCH_SUCCESS,
	VAULTPRESS_SITE_DATA_FETCH,
	VAULTPRESS_SITE_DATA_FETCH_FAIL,
	VAULTPRESS_SITE_DATA_FETCH_SUCCESS,
	DASHBOARD_PROTECT_COUNT_FETCH,
	DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
	DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS
} from 'state/action-types';

const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case AKISMET_DATA_FETCH:
			return assign( {}, state, { fetchingAkismetData: true } );
		case MONITOR_LAST_DOWNTIME_FETCH:
			return assign( {}, state, { fetchingMonitorData: true } );
		case VAULTPRESS_SITE_DATA_FETCH:
			return assign( {}, state, { fetchingVaultPressData: true } );
		case DASHBOARD_PROTECT_COUNT_FETCH:
			return assign( {}, state, { fetchingProtectData: true } );

		case AKISMET_DATA_FETCH_FAIL:
		case AKISMET_DATA_FETCH_SUCCESS:
		case MONITOR_LAST_DOWNTIME_FETCH_FAIL:
		case MONITOR_LAST_DOWNTIME_FETCH_SUCCESS:
		case VAULTPRESS_SITE_DATA_FETCH_FAIL:
		case VAULTPRESS_SITE_DATA_FETCH_SUCCESS:
		case DASHBOARD_PROTECT_COUNT_FETCH_FAIL:
		case DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS:
			return assign( {}, state, {
				fetchingAkismetData: false,
				fetchingMonitorData: false,
				fetchingVaultPressData: false,
				fetchingProtectData: false
			} );

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

const lastDownTime = ( state = 'N/A', action ) => {
	switch ( action.type ) {
		case MONITOR_LAST_DOWNTIME_FETCH_SUCCESS:
			return action.lastDownTime;

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


export const dashboard = combineReducers( {
	requests,
	protectCount,
	lastDownTime,
	vaultPressData,
	akismetData
} );

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
 * @return {int}
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
 * @return {int}
 */
export function getProtectCount( state ) {
	return state.jetpack.dashboard.protectCount;
}

/**
 * Returns true if currently requesting Monitor data
 *
 * @param  {Object}  state  Global state tree
 * @return {Boolean}        Whether Monitor data is being requested
 */
export function isFetchingMonitorData( state ) {
	return state.jetpack.dashboard.requests.fetchingMonitorData ? true : false;
}

/**
 * Returns last downtime of the site, from Monitor.
 *
 * @param  {Object}  state  Global state tree
 * @return {String}
 */
export function getLastDownTime( state ) {
	return state.jetpack.dashboard.lastDownTime;
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
 * @return {Object}
 */
export function getVaultPressData( state ) {
	return state.jetpack.dashboard.vaultPressData;
}

/**
 *
 * Returns number of VaultPress Scan threats found.
 *
 * @param  {Object}  state  Global state tree
 * @return {int}
 */
export function getVaultPressScanThreatCount( state ) {
	return state.jetpack.dashboard.vaultPressData.data.security.notice_count;
}
