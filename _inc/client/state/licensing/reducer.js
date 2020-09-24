/**
 * External dependencies
 */
import { get } from 'lodash';
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { JETPACK_LICENSING_ERROR_UPDATE } from 'state/action-types';

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
 * Licensing combined reducer.
 */
export const reducer = combineReducers( {
	error,
} );

/**
 * Get the latest licensing error, if any.
 *
 * @param {Object} state   Global state tree.
 *
 * @return {string} Error message or an empty string.
 */
export function getLicensingError( state ) {
	return get( state.jetpack.licensing, [ 'error' ], '' );
}
