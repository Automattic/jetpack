import { SET_SOCIAL_NOTES_SETTINGS } from '../actions/social-notes-settings';

const autoConversionSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SOCIAL_NOTES_SETTINGS:
			return {
				...state,
				...action.options,
			};
	}
	return state;
};

export default autoConversionSettings;
