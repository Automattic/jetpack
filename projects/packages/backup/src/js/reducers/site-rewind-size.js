import {
	SITE_REWIND_SIZE_GET,
	SITE_REWIND_SIZE_GET_SUCCESS,
	SITE_REWIND_SIZE_GET_FAILED,
} from '../actions/types';

const initialState = {
	isFetching: false,
	loaded: false,
	size: null,
};

const siteRewindSize = ( state = initialState, action ) => {
	switch ( action.type ) {
		case SITE_REWIND_SIZE_GET: {
			return {
				...state,
				isFetching: true,
				loaded: false,
			};
		}

		case SITE_REWIND_SIZE_GET_SUCCESS: {
			return {
				...state,
				isFetching: false,
				loaded: true,
				size: action.payload.size,
			};
		}
		case SITE_REWIND_SIZE_GET_FAILED: {
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

export default siteRewindSize;
