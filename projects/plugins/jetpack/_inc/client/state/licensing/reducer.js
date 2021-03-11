/**
 * External dependencies
 */
import { get, assign } from 'lodash';
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_LICENSES_FETCH,
	JETPACK_LICENSING_LICENSES_FETCH_FAIL,
	JETPACK_LICENSING_LICENSES_FETCH_RECEIVE,
} from 'state/action-types';

/**
 * Error reducer.
 *
 * @param {string} state - state
 * @param {object} action - action
 * @returns {string} - error
 */
export const error = ( state = window.Initial_State.licensing.error, action ) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_ERROR_UPDATE:
			return action.error;

		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingLicenses: false,
	isDoneFetchingLicenses: false,
};

/**
 * Requests reducer.
 *
 * @param {string} state - state
 * @param {object} action - action
 * @returns {string} - requests
 */
export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_LICENSES_FETCH:
			return assign( {}, state, {
				isFetchingLicenses: true,
			} );
		case JETPACK_LICENSING_LICENSES_FETCH_FAIL:
		case JETPACK_LICENSING_LICENSES_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingLicenses: false,
				isDoneFetchingLicenses: true,
			} );
		default:
			return state;
	}
};

/**
 * Data reducer.
 *
 * @param {string} state - state
 * @param {object} action - action
 * @returns {string} - data
 */
export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_LICENSES_FETCH_RECEIVE:
			return assign( {}, state, {
				licenses: action.licenses,
			} );
		default:
			return state;
	}
};

/**
 * Licensing combined reducer.
 */
export const reducer = combineReducers( {
	data,
	requests,
	error,
} );

/**
 * Get the latest licensing error, if any.
 *
 * @param {object} state - Global state tree.
 *
 * @returns {string} Error message or an empty string.
 */
export function getLicensingError( state ) {
	return get( state.jetpack.licensing, [ 'error' ], '' );
}

/**
 * Returns true if currently requesting licenses. Otherwise false.
 *
 * @param  {object} state - Global state tree
 * @returns {boolean}     - Are licenses requested?
 */
export function isFetchingLicenses( state ) {
	return !! state.jetpack.licensing.requests.isFetchingLicenses;
}

/**
 * Returns true if the licenses request has completed (even if it returned an error). Otherwise false.
 *
 * @param  {object}  state - Global state tree
 * @returns {boolean}       - Is the licenses request completed?
 */
export function isDoneFetchingLicenses( state ) {
	return !! state.jetpack.licensing.requests.isDoneFetchingLicenses;
}

/**
 * Returns all licenses stored for that site.
 *
 * @param  {object} state - Global state tree
 * @returns {string}      - Stored licenses
 */
export function getLicenses( state ) {
	if ( ! isDoneFetchingLicenses( state ) ) {
		return null;
	}

	const licenses = get( state.jetpack.licensing, [ 'data', 'licenses' ], [] );
	return licenses.join( ', ' );
}
