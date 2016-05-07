/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
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


export const dashboard = combineReducers( {
	protectCount,
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
 * Returns all VaultPress data as an object.
 *
 * @param  {Object}  state  Global state tree
 * @return {Object}
 */
export function getVaultPressData( state ) {
	return state.jetpack.dashboard.vaultPressData;
}
