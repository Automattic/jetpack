/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SET_CONNECTION_STATUS, SET_CONNECTION_STATUS_IS_FETCHING } from './actions';

const connectionStatus = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CONNECTION_STATUS:
			return { ...state, ...action.connectionStatus };
	}

	return state;
};

const connectionStatusIsFetching = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_CONNECTION_STATUS_IS_FETCHING:
			return action.isFetching;
	}

	return state;
};

const reducers = combineReducers( {
	connectionStatus,
	connectionStatusIsFetching,
} );

export default reducers;
