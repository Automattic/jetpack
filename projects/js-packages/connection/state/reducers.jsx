/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	SET_CONNECTION_STATUS,
	SET_CONNECTION_STATUS_IS_FETCHING,
	SET_SITE_IS_REGISTERING,
	SET_USER_IS_CONNECTING,
} from './actions';

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

const siteIsRegistering = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_SITE_IS_REGISTERING:
			return action.isRegistering;
	}

	return state;
};

const userIsConnecting = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_USER_IS_CONNECTING:
			return action.isConnecting;
	}

	return state;
};

const reducers = combineReducers( {
	connectionStatus,
	connectionStatusIsFetching,
	siteIsRegistering,
	userIsConnecting,
} );

export default reducers;
