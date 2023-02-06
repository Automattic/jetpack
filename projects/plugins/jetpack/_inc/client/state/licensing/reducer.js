import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_USER_LICENSE_COUNTS_UPDATE,
	JETPACK_LICENSING_ACTIVATION_NOTICE_DISMISS_UPDATE,
	JETPACK_LICENSING_GET_USER_LICENSES_SUCCESS,
	JETPACK_LICENSING_GET_USER_LICENSES_FETCH,
	JETPACK_LICENSING_GET_USER_LICENSES_FAILURE,
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
 * "user"-licenses.
 *
 * @param {number} state - Global state tree
 * @param {object} action - The action
 * @returns {object} - The 'items' and 'loading' state
 */
export const licenses = (
	state = window.Initial_State.licensing.licenses ?? {
		items: [],
		loading: false,
	},
	action
) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_GET_USER_LICENSES_FETCH:
			return {
				...state,
				loading: true,
			};
		case JETPACK_LICENSING_GET_USER_LICENSES_SUCCESS:
			return {
				...state,
				...action.data,
				loading: false,
			};
		case JETPACK_LICENSING_GET_USER_LICENSES_FAILURE:
			return {
				...state,
				loading: false,
			};
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
	licenses,
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
 * Get the licenses
 *
 * @param {object} state - Global state tree.
 * @returns {Array} - An array containing all the detached licenses
 */
export function getDetachedLicenses( state ) {
	const allLicenses = get( state.jetpack.licensing.licenses, [ 'items' ], {} );
	return Object.values( allLicenses ).filter( ( { attached_at } ) => attached_at === null );
}

/**
 * Get the license loading info
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} - A boolean value of loading state of licenses
 */
export function getDetachedLicensesLoadingInfo( state ) {
	return get( state.jetpack.licensing.licenses, [ 'loading' ], false );
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
