import { SET_AUTO_CONVERSION_SETTINGS } from '../actions/auto-conversion-settings';

const autoConversionSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_AUTO_CONVERSION_SETTINGS:
			return {
				...state,
				...action.options,
			};
	}
	return state;
};

export default autoConversionSettings;
