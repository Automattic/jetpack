import { assign } from 'lodash';
import { combineReducers } from 'redux';
import {
	USER_TRACKING_SETTINGS_FETCH,
	USER_TRACKING_SETTINGS_FETCH_FAIL,
	USER_TRACKING_SETTINGS_FETCH_SUCCESS,
	USER_TRACKING_SETTINGS_UPDATE,
	USER_TRACKING_SETTINGS_UPDATE_FAIL,
	USER_TRACKING_SETTINGS_UPDATE_SUCCESS,
} from 'state/action-types';

export const initialRequestsState = {
	fetchingTrackingSettings: false,
	updatingTrackingSettings: false,
};

export const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case USER_TRACKING_SETTINGS_FETCH_SUCCESS:
			return assign( {}, state, action.settings );

		case USER_TRACKING_SETTINGS_UPDATE_SUCCESS:
			return assign( {}, state, action.updatedSettings );

		default:
			return state;
	}
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case USER_TRACKING_SETTINGS_FETCH:
			return assign( {}, state, {
				fetchingTrackingSettings: true,
			} );

		case USER_TRACKING_SETTINGS_FETCH_FAIL:
		case USER_TRACKING_SETTINGS_FETCH_SUCCESS:
			return assign( {}, state, {
				fetchingTrackingSettings: false,
			} );

		case USER_TRACKING_SETTINGS_UPDATE:
			return assign( {}, state, {
				updatingTrackingSettings: true,
			} );

		case USER_TRACKING_SETTINGS_UPDATE_FAIL:
		case USER_TRACKING_SETTINGS_UPDATE_SUCCESS:
			return assign( {}, state, {
				updatingTrackingSettings: false,
			} );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests,
} );

/**
 * Returns tracking settings.
 *
 * @param  {Object} state Global state tree.
 * @return {Object}       Settings keyed by name.
 */
export function getTrackingSettings( state ) {
	return state.jetpack.trackingSettings.items;
}

/**
 * Returns true if currently requesting settings.
 *
 * @param  {Object}  state Global state tree.
 * @return {Boolean}       Whether settings are being fetched.
 */
export function isFetchingTrackingSettingsList( state ) {
	return state.jetpack.trackingSettings.requests.fetchingTrackingSettings;
}

/**
 * Returns true if currently updating settings.
 *
 * @param  {Object}  state Global state tree.
 * @return {Boolean}       Whether settings are being updated.
 */
export function isUpdatingTrackingSettings( state ) {
	return state.jetpack.trackingSettings.requests.updatingTrackingSettings;
}
