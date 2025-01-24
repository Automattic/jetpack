import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	ACCOUNT_PROTECTION_SETTINGS_FETCH,
	ACCOUNT_PROTECTION_SETTINGS_FETCH_RECEIVE,
	ACCOUNT_PROTECTION_SETTINGS_FETCH_FAIL,
	ACCOUNT_PROTECTION_SETTINGS_UPDATE,
	ACCOUNT_PROTECTION_SETTINGS_UPDATE_SUCCESS,
	ACCOUNT_PROTECTION_SETTINGS_UPDATE_FAIL,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case ACCOUNT_PROTECTION_SETTINGS_FETCH_RECEIVE:
		case ACCOUNT_PROTECTION_SETTINGS_UPDATE_SUCCESS:
			return assign( {}, state, {
				strictMode: Boolean( action.settings?.jetpack_account_protection_strict_mode ),
			} );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingAccountProtectionSettings: false,
	isUpdatingAccountProtectionSettings: false,
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case ACCOUNT_PROTECTION_SETTINGS_FETCH:
			return assign( {}, state, {
				isFetchingAccountProtectionSettings: true,
			} );
		case ACCOUNT_PROTECTION_SETTINGS_FETCH_RECEIVE:
		case ACCOUNT_PROTECTION_SETTINGS_FETCH_FAIL:
			return assign( {}, state, {
				isFetchingAccountProtectionSettings: false,
			} );
		case ACCOUNT_PROTECTION_SETTINGS_UPDATE:
			return assign( {}, state, {
				isUpdatingAccountProtectionSettings: true,
			} );
		case ACCOUNT_PROTECTION_SETTINGS_UPDATE_SUCCESS:
		case ACCOUNT_PROTECTION_SETTINGS_UPDATE_FAIL:
			return assign( {}, state, {
				isUpdatingAccountProtectionSettings: false,
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests,
} );

/**
 * Returns true if currently requesting the account protection settings. Otherwise false.
 *
 * @param {object} state - Global state tree
 * @return {boolean} Whether the account protection settings are being requested
 */
export function isFetchingAccountProtectionSettings( state ) {
	return !! state.jetpack.accountProtection.requests.isFetchingAccountProtectionSettings;
}

/**
 * Returns true if currently updating the account protection settings. Otherwise false.
 *
 * @param {object} state - Global state tree
 * @return {boolean} Whether the account protection settings are being requested
 */
export function isUpdatingAccountProtectionSettings( state ) {
	return !! state.jetpack.accountProtection.requests.isUpdatingAccountProtectionSettings;
}

/**
 * Returns the account protection's settings.
 *
 * @param {object} state - Global state tree
 * @return {string}  File path to bootstrap.php
 */
export function getAccountProtectionSettings( state ) {
	return get( state.jetpack.accountProtection, [ 'data' ], {} );
}
