/**
 * External dependencies
 */
import { get } from 'lodash';
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_UNATTACHED_USER_LICENSES_COUNT_RECIEVE,
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
 * Unattached (available for activation) "user" licenses reducer.
 *
 * @param {number} state - Global state tree
 * @param {object} action - The action
 * @returns {number} - The number of unattached licenses
 */
export const unattachedUserLicensesCount = (
	state = window.Initial_State.licensing.unattachedUserLicensesCount ?? 0,
	action
) => {
	switch ( action.type ) {
		case JETPACK_LICENSING_UNATTACHED_USER_LICENSES_COUNT_RECIEVE:
			return action.count;

		default:
			return state;
	}
};

/**
 * Licensing combined reducer.
 */
export const reducer = combineReducers( {
	error,
	unattachedUserLicensesCount,
} );

/**
 * Get the latest licensing error, if any.
 *
 * @param {Object} state - Global state tree.
 * @returns {string} Error message or an empty string.
 */
export function getLicensingError( state ) {
	return get( state.jetpack.licensing, [ 'error' ], '' );
}

/**
 * Determines if the user has unattached "user" licenses available for product activation.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if the user has unattached user licenses, false otherwise.
 */
export function hasAvailableUserLicenses( state ) {
	return !! get( state.jetpack.licensing, [ 'unattachedUserLicensesCount' ], 0 );
}
