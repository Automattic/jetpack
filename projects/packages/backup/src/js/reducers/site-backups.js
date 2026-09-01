import {
	SITE_BACKUPS_GET,
	SITE_BACKUPS_GET_SUCCESS,
	SITE_BACKUPS_GET_FAILED,
} from '../actions/types';

const initialState = {
	isFetching: false,
	loaded: false,
	backups: [],
	fetchFailed: false,
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
				fetchFailed: false,
			};
		}
		case SITE_BACKUPS_GET_FAILED: {
			// `backups` is deliberately left alone. A poll tick that fails
			// against a site that already loaded its list should not blank the
			// screen — the list on it is still the last thing WordPress.com
			// actually said. Only a failure with nothing loaded is reported to
			// the reader, which `useBackupsState` decides.
			return {
				...state,
				isFetching: false,
				loaded: true,
				fetchFailed: true,
			};
		}
		default:
			return state;
	}
};

export default siteBackups;
