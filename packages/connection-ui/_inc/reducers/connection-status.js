/**
 * Internal dependencies
 */
import {
	CONNECTION_STATUS_ACTIVE,
	CONNECTION_STATUS_INACTIVE,
	CONNECTION_STATUS_REFRESHING,
	CONNECTION_STATUS_REFRESHED,
} from '../actions/connection-status';

const connectionStatus = ( state = {}, action ) => {
	switch ( action.type ) {
		case CONNECTION_STATUS_ACTIVE:
			return {
				...state,
				isActive: true,
			};
		case CONNECTION_STATUS_INACTIVE:
			return {
				...state,
				isActive: false,
			};
		case CONNECTION_STATUS_REFRESHING:
			return {
				...state,
				isActive: false,
				isRefreshing: true,
			};
		case CONNECTION_STATUS_REFRESHED:
			return {
				...state,
				isActive: true,
				isRefreshing: false,
			};
	}

	return state;
};

export default connectionStatus;
