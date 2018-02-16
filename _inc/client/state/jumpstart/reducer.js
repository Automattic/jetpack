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

const jumpstartState = {
	showJumpStart: typeof window !== 'undefined' && typeof window.Initial_State === 'object'
		? window.Initial_State.showJumpstart
		: {},
	isJumpstarting: false
};

export const status = ( state = jumpstartState, action ) => {
	switch ( action.type ) {
		case JUMPSTART_ACTIVATE:
			return assign( {}, state, { isJumpstarting: true } );

		case RESET_OPTIONS_SUCCESS:
			return assign( {}, state, { showJumpStart: true } );
		case JUMPSTART_ACTIVATE_SUCCESS:
		case JUMPSTART_SKIP:
			return assign( {}, state, { showJumpStart: false, isJumpstarting: false } );

		case JUMPSTART_ACTIVATE_FAIL:
			return assign( {}, state, { isJumpstarting: false } );

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

/**
 * Returns true if activating Jumpstart
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if Jump Start is being activated
 */
export function isJumpstarting( state ) {
	return state.jetpack.jumpstart.status.isJumpstarting;
}
