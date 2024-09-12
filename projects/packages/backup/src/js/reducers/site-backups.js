import {
	SITE_BACKUPS_GET,
	SITE_BACKUPS_GET_SUCCESS,
	SITE_BACKUPS_GET_FAILED,
} from '../actions/types';

const initialState = {
	isFetching: false,
	loaded: false,
	backups: [],
};

const siteBackups = ( state = initialState, action ) => {
	switch ( action.type ) {
		case SITE_BACKUPS_GET: {
			return {
				...state,
				isFetching: true,
				loaded: false,
			};
		}

		case SITE_BACKUPS_GET_SUCCESS: {
			return {
				...state,
				isFetching: false,
				loaded: true,
				backups: action.payload,
			};
		}
		case SITE_BACKUPS_GET_FAILED: {
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

export default siteBackups;
