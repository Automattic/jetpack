/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';

export const initialState = ( state = window.Initial_State, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return Object.assign( {}, state, action.initialState );

		default:
			return state;
	}
};
