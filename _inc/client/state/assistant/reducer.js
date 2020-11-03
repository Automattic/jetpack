/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign } from 'lodash';

import {
	JETPACK_ASSISTANT_DATA_FETCH_RECEIVE,
	JETPACK_ASSISTANT_STEP_FETCH_RECEIVE,
} from 'state/action-types';

const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_ASSISTANT_DATA_FETCH_RECEIVE:
			return assign( {}, state, action.answer );
		default:
			return state;
	}
};

const step = ( state = '', action ) => {
	switch ( action.type ) {
		case JETPACK_ASSISTANT_STEP_FETCH_RECEIVE:
			return action.step;
		default:
			return state;
	}
};

export const reducer = combineReducers( { data, step } );
