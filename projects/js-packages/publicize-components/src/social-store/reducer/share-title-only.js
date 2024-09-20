import { SET_SHARE_TITLE_ONLY } from '../actions/share-title-only';

const shareTitleOnly = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SHARE_TITLE_ONLY:
			return {
				...state,
				...action.options,
			};
	}
	return state;
};

export default shareTitleOnly;
