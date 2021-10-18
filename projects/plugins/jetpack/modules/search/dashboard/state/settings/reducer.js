/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, filter, get, includes, mapValues, merge, some } from 'lodash';

/**
 * Internal dependencies
 */
import {
	JETPACK_SET_INITIAL_STATE,
	JETPACK_SETTINGS_FETCH,
	JETPACK_SETTINGS_FETCH_RECEIVE,
	JETPACK_SETTINGS_FETCH_FAIL,
	JETPACK_SETTING_UPDATE,
	JETPACK_SETTING_UPDATE_SUCCESS,
	JETPACK_SETTING_UPDATE_FAIL,
	JETPACK_SETTINGS_UPDATE,
	JETPACK_SETTINGS_UPDATE_SUCCESS,
	JETPACK_SETTINGS_UPDATE_FAIL,
	JETPACK_SETTINGS_SET_UNSAVED_FLAG,
	JETPACK_SETTINGS_CLEAR_UNSAVED_FLAG,
} from 'state/action-types';

export const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return assign( {}, state, action.initialState.settings );
		case JETPACK_SETTINGS_FETCH_RECEIVE:
			return assign( {}, action.settings );
		case JETPACK_SETTING_UPDATE_SUCCESS:
			const key = Object.keys( action.updatedOption )[ 0 ];
			return assign( {}, state, {
				[ key ]: action.updatedOption[ key ],
			} );
		case JETPACK_SETTINGS_UPDATE_SUCCESS:
			return assign( {}, state, action.updatedOptions );
		default:
			return state;
	}
};

export const initialRequestsState = {
	fetchingSettingsList: false,
	settingsSent: {},
	updatedSettings: {},
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_SETTINGS_FETCH:
			return assign( {}, state, {
				fetchingSettingsList: true,
			} );
		case JETPACK_SETTINGS_FETCH_FAIL:
		case JETPACK_SETTINGS_FETCH_RECEIVE:
			return assign( {}, state, {
				fetchingSettingsList: false,
			} );

		case JETPACK_SETTING_UPDATE:
		case JETPACK_SETTINGS_UPDATE:
			return merge( {}, state, {
				settingsSent: mapValues( action.updatedOptions, () => true ),
			} );
		case JETPACK_SETTING_UPDATE_FAIL:
		case JETPACK_SETTING_UPDATE_SUCCESS:
		case JETPACK_SETTINGS_UPDATE_FAIL:
		case JETPACK_SETTINGS_UPDATE_SUCCESS:
			return merge( {}, state, {
				settingsSent: mapValues( action.updatedOptions, () => false ),
				updatedSettings: mapValues( action.updatedOptions, () => Boolean( action.success ) ),
			} );
		default:
			return state;
	}
};

export const unsavedSettingsFlag = ( state = false, action ) => {
	switch ( action.type ) {
		case JETPACK_SETTINGS_SET_UNSAVED_FLAG:
			return true;
		case JETPACK_SETTINGS_CLEAR_UNSAVED_FLAG:
			return false;
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests,
	unsavedSettingsFlag,
} );

/**
 * Returns an object with Jetpack settings keyed by setting name.
 *
 * @param  {object} state -  Global state tree
 * @param state
 * @returns {object}       Settings keyed by setting name
 */
export function getSettings( state ) {
	return state.jetpack.settings.items;
}

/**
 * Returns a value of a certain setting
 *
 * @param  {object} state     -  Global state tree
 * @param  {string} key       -  Name of setting or module option to return.
 * @param  {string} moduleName -  If present, it will check if the module is active before returning it.
 * @param moduleName
 * @returns {undefined|*}       Settings value or undefined if a module was specified and it wasn't active.
 */
export function getSetting( state, key, moduleName = '' ) {
	if ( '' !== moduleName && ! get( state.jetpack.settings.items, moduleName, false ) ) {
		return undefined;
	}
	return get( state.jetpack.settings.items, key, undefined );
}

/**
 * Returns true if currently requesting settings lists or false
 * otherwise.
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @returns {boolean}       Whether settings are being requested
 */
export function isFetchingSettingsList( state ) {
	return !! state.jetpack.settings.requests.fetchingSettingsList;
}

/**
 * Returns true if we are currently making a request to update a setting's option
 *
 * @param  {object}        state   -  Global state tree
 * @param  {string | Array} settings -  Single or multiple settings to check if they're being saved or not.
 * @param settings
 * @returns {boolean}                Whether option is being updated on the setting
 */
export function isUpdatingSetting( state, settings = '' ) {
	if ( 'object' === typeof settings ) {
		return some(
			filter( state.jetpack.settings.requests.settingsSent, ( item, key ) =>
				includes( settings, key )
			),
			item => item
		);
	}
	return state.jetpack.settings.requests.settingsSent[ settings ];
}

/**
 * Returns true if we successfully updated a setting
 *
 * @param  {object}   state   -  Global state tree
 * @param  {string}   setting -  A setting name
 * @returns {boolean | undefined} Whether the option has been updated successfully. Undefined if an attempt has not yet been made.
 */
export function hasUpdatedSetting( state, setting = '' ) {
	return state.jetpack.settings.requests.updatedSettings[ setting ];
}

/**
 * Returns true if the setting is "checked".
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @param  {string}  name -  A setting's name
 * @returns {boolean}       Whether a setting is checked
 */
export function isSettingActivated( state, name ) {
	return get( state.jetpack.settings.items, [ name ], false ) ? true : false;
}

/**
 * Returns true if the setting is "checked".
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @param  {string}  name -  A setting's name
 * @returns {boolean}       Whether a setting is checked
 */
export function toggleSetting( state, name ) {
	return get( state.jetpack.settings.items, [ name ], false ) ? true : false;
}

/**
 * Returns true if there are unsaved settings.
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @returns {boolean}  Whether there are unsaved settings
 */
export function areThereUnsavedSettings( state ) {
	return get( state.jetpack.settings, 'unsavedSettingsFlag', false );
}

/**
 * Returns true if apps card has been dismissed.
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @returns {boolean}  Whether the card has been dismissed
 */
export function appsCardDismissed( state ) {
	return get( state.jetpack.settings.items, 'dismiss_dash_app_card', false );
}

/**
 * Returns true if Empty Stats card has been dismissed.
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @returns {boolean} Whether the card has been dismissed
 */
export function emptyStatsCardDismissed( state ) {
	return get( state.jetpack.settings.items, 'dismiss_empty_stats_card', false );
}
