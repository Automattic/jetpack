import { SITE_BACKUP_STORAGE_SET } from '../actions/types';

const initialState = {
	usageLevel: null,
};

const siteBackupStorage = ( state = initialState, action ) => {
	if ( action.type === SITE_BACKUP_STORAGE_SET ) {
		return {
			...state,
			usageLevel: action.usageLevel ?? null,
		};
	}

	return state;
};

export default siteBackupStorage;
