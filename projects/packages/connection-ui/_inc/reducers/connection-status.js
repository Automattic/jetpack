/**
 * Internal dependencies
 */
import {
	CONNECTION_STATUS_REGISTERED,
	CONNECTION_STATUS_USER_CONNECTED,
} from '../actions/connection-status';

const connectionStatus = ( state = {}, action ) => {
	switch ( action.type ) {
		case CONNECTION_STATUS_REGISTERED:
			return {
				...state,
				isRegistered: action.isRegistered,
			};
		case CONNECTION_STATUS_USER_CONNECTED:
			return {
				...state,
				isUserConnected: action.isUserConnected,
			};
	}

	return state;
};

export default connectionStatus;
