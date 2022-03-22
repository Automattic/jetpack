/**
 * External dependencies
 */
import { assign, get } from 'lodash';
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_USER_LICENSE_COUNTS_UPDATE,
	JETPACK_LICENSING_ACTIVATION_NOTICE_DISMISS_UPDATE,
} from 'state/action-types';

/**
 * Error reducer.
 *
 * @param {string} state
 * @param {object} action
 * @returns {string}
 */
export const error = ( state = window.Initial_State.licensing.error, action ) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_ERROR_UPDATE:
			return action.error;

		default:
			return state;
	}
};

/**
 * "user" licenses counts reducer.
 *
 * @param {number} state - Global state tree
 * @param {object} action - The action
 * @returns {object} - The counts of user licenses
 */
export const userCounts = ( state = window.Initial_State.licensing.userCounts ?? {}, action ) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_USER_LICENSE_COUNTS_UPDATE:
			return assign( {}, state, action.counts );

		default:
			return state;
	}
};

/**
 * "user"-licenses activation notice dismissal info.
 *
 * @param {number} state - Global state tree
 * @param {object} action - The action
 * @returns {object} - The 'last_detached_count' and 'last_dismissed_time'
 */
export const activationNoticeDismiss = (
	state = window.Initial_State.licensing.activationNoticeDismiss ?? {
		last_detached_count: null,
		last_dismissed_time: null,
	},
	action
) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_ACTIVATION_NOTICE_DISMISS_UPDATE:
			return assign( {}, state, action.dismissData );

		default:
			return state;
	}
};

/**
 * Licensing combined reducer.
 */
export const reducer = combineReducers( {
	error,
	userCounts,
	activationNoticeDismiss,
} );

/**
 * Get the latest licensing error, if any.
 *
 * @param {Object} state - Global state tree.
 * @returns {string} - Error message or an empty string.
 */
export function getLicensingError( state ) {
	return get( state.jetpack.licensing, [ 'error' ], '' );
}

/**
 * Determines if the user has detached "user" licenses available for product activation.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} - True if the user has detached user licenses, false otherwise.
 */
export function hasDetachedUserLicenses( state ) {
	return !! get( state.jetpack.licensing.userCounts, [ 'detached' ], 0 );
}

/**
 * Get the user's number of detached licenses.
 *
 * @param {object} state - Global state tree.
 * @returns {number} - Number of detached licenses.
 */
export function getDetachedLicensesCount( state ) {
	return get( state.jetpack.licensing.userCounts, [ 'detached' ], 0 );
}

/**
 * Get the license activation notice dismiss info.
 *
 * @param {object} state - Global state tree.
 * @returns {object} - An object containing last_detached_count and last_dismissed_time.
 */
export function getActivationNoticeDismissInfo( state ) {
	return get( state.jetpack.licensing, [ 'activationNoticeDismiss' ], {} );
}
