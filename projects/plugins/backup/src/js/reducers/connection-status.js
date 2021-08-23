/**
 * Internal dependencies
 */
import { SET_CONNECTION_STATUS } from '../actions/connection-status';

const connectionStatus = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CONNECTION_STATUS:
			return action.connectionStatus;
	}

	return state;
};

export default connectionStatus;
