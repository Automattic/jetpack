/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import {
	JETPACK_SETTINGS_FETCH,
	JETPACK_SETTINGS_FETCH_RECEIVE,
	JETPACK_SETTINGS_FETCH_FAIL,
	JETPACK_SETTING_UPDATE,
	JETPACK_SETTING_UPDATE_SUCCESS,
	JETPACK_SETTING_UPDATE_FAIL
} from 'state/action-types';

const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SETTINGS_FETCH_RECEIVE:
			return Object.assign( {}, action.settings );
		case JETPACK_SETTING_UPDATE_SUCCESS:
			let key = Object.keys( action.updatedOption )[0];
			return Object.assign( {}, state, {
				[ key ]: action.updatedOption[ key ]
			} );
		default:
			return state;
	}
};

const initialRequestsState = {
	fetchingSettingsList: false,
	updatingSetting: {}
};

const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_SETTINGS_FETCH:
			return Object.assign( {}, state, {
				fetchingSettingsList: true
			} );
		case JETPACK_SETTINGS_FETCH_FAIL:
		case JETPACK_SETTINGS_FETCH_RECEIVE:
			return Object.assign( {}, state, {
				fetchingSettingsList: false
			} );

		case JETPACK_SETTING_UPDATE:
			return Object.assign( {}, state, {
				updatingSetting: true
			} );
		case JETPACK_SETTING_UPDATE_FAIL:
		case JETPACK_SETTING_UPDATE_SUCCESS:
			return Object.assign( {}, state, {
				updatingSetting: true
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests
} );

/**
 * Returns an object with Jetpack settings keyed by setting name.
 * @param  {Object} state Global state tree
 * @return {Object}       Settings keyed by setting name
 */
export function getSettings( state ) {
	return state.jetpack.settings.items;
}

/**
 * Returns true if currently requesting settings lists or false
 * otherwise.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether settings are being requested
 */
export function isFetchingSettingsList( state ) {
	return !!state.jetpack.settings.requests.fetchingSettingsList;
}

/**
 * Returns true if we are currently making a request to update a setting's option
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether option is being updated on the setting
 */
export function isUpdatingSetting( state ) {
	return state.jetpack.settings.requests.updatingSetting;
}

/**
 * Returns true if the setting is "checked".
 * @param  {Object}  state Global state tree
 * @param  {String}  name  A setting's name
 * @return {Boolean}       Whether a setting is checked
 */
export function isSettingActivated( state, name ) {
	return get( state.jetpack.settings.items, [ name ], false ) ? true : false;
}

/**
 * Returns true if the setting is "checked".
 * @param  {Object}  state Global state tree
 * @param  {String}  name  A setting's name
 * @return {Boolean}       Whether a setting is checked
 */
export function toggleSetting( state, name ) {
	return get( state.jetpack.settings.items, [ name ], false ) ? true : false;
}
