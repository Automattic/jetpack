/**
 * Internal dependencies
 */
import {
	CONNECTION_STATUS_ACTIVE,
	CONNECTION_STATUS_INACTIVE,
	CONNECTION_STATUS_REFRESHING,
	CONNECTION_STATUS_REFRESHED,
	CONNECTION_STATUS_REFRESHED_RESET,
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
				isRefreshed: false,
			};
		case CONNECTION_STATUS_REFRESHED:
			return {
				...state,
				isActive: true,
				isRefreshing: false,
				isRefreshed: true,
			};
		case CONNECTION_STATUS_REFRESHED_RESET:
			return {
				...state,
				isRefreshed: false,
			};
	}

	return state;
};

export default connectionStatus;
