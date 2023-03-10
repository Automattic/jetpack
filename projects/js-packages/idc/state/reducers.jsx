import { combineReducers } from '@wordpress/data';
import { SET_IS_ACTION_IN_PROGRESS, SET_ERROR_TYPE, CLEAR_ERROR_TYPE } from './actions';

const isActionInProgress = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_IS_ACTION_IN_PROGRESS:
			return action.isInProgress;
	}

	return state;
};

const errorType = ( state = null, action ) => {
	switch ( action.type ) {
		case SET_ERROR_TYPE:
			return action.errorType;
		case CLEAR_ERROR_TYPE:
			return null;
	}

	return state;
};

const reducers = combineReducers( {
	isActionInProgress,
	errorType,
} );

export default reducers;
