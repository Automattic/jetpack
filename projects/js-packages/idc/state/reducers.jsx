/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SET_IS_ACTION_IN_PROGRESS } from './actions';

const isActionInProgress = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_IS_ACTION_IN_PROGRESS:
			return action.isInProgress;
	}

	return state;
};

const reducers = combineReducers( {
	isActionInProgress,
} );

export default reducers;
