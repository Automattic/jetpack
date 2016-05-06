/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import assign from 'lodash/assign';

/**
 * Internal dependencies
 */
import {
	RESET_OPTIONS_SUCCESS,
	JUMPSTART_ACTIVATE,
	JUMPSTART_ACTIVATE_FAIL,
	JUMPSTART_ACTIVATE_SUCCESS,
	JUMPSTART_SKIP
} from 'state/action-types';
import restApi from 'rest-api';

const status = ( state = { showJumpStart: window.Initial_State.showJumpstart }, action ) => {
	switch ( action.type ) {
		case RESET_OPTIONS_SUCCESS:
			return assign( {}, state, { showJumpStart: true } );
		case JUMPSTART_ACTIVATE_SUCCESS:
		case JUMPSTART_SKIP:
			return assign( {}, state, { showJumpStart: false } );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	status
} );

/**
 * Returns true if site is connected to WordPress.com
 *
 * @param  {Object} state Global state tree
 * @return {bool}         True if site is connected, False if it is not.
 */
export function getJumpStartStatus( state ) {
	return state.jetpack.jumpstart.status.showJumpStart;
}