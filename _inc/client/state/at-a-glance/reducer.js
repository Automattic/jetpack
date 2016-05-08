/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import assign from 'lodash/assign';

/**
 * Internal dependencies
 */
import {
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

const protectCount = ( state = 'N/A', action ) => {
	switch ( action.type ) {
		case DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS:
			return assign( {}, action.protectCount );

		default:
			return state;
	}
};

const lastDownTime = ( state = 'N/A', action ) => {
	switch ( action.type ) {
		case MONITOR_LAST_DOWNTIME_FETCH_SUCCESS:
			return assign( {}, action.lastDownTime );

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
	protectCount,
	lastDownTime,
	vaultPressData
} );

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
 * Returns last downtime of the site, from Monitor.
 *
 * @param  {Object}  state  Global state tree
 * @return {String}
 */
export function getLastDownTime( state ) {
	return state.jetpack.dashboard.lastDownTime;
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
