import {
	SITE_REWIND_POLICIES_GET,
	SITE_REWIND_POLICIES_GET_SUCCESS,
	SITE_REWIND_POLICIES_GET_FAILED,
} from '../actions/types';

const initialState = {
	isFetching: false,
	loaded: false,
	activityLogLimitDays: null,
	storageLimitBytes: null,
};

const siteRewindPolicies = ( state = initialState, action ) => {
	switch ( action.type ) {
		case SITE_REWIND_POLICIES_GET: {
			return {
				...state,
				isFetching: true,
				loaded: false,
			};
		}

		case SITE_REWIND_POLICIES_GET_SUCCESS: {
			return {
				...state,
				isFetching: false,
				loaded: true,
				activityLogLimitDays: action.payload.activityLogLimitDays,
				storageLimitBytes: action.payload.storageLimitBytes,
			};
		}
		case SITE_REWIND_POLICIES_GET_FAILED: {
			return {
				...state,
				isFetching: false,
				loaded: true,
			};
		}
		default:
			return state;
	}
};

export default siteRewindPolicies;
