import { SET_JETPACK_SETTINGS } from '../actions/jetpack-settings';

const jetpackSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_JETPACK_SETTINGS:
			return {
				...state,
				...action.options,
				is_toggling_module:
					state.jetpackSettings?.search !== action.options.search &&
					action.options.isUpdatingOptions,
				is_toggling_instant_search:
					state.jetpackSettings?.instant_search_enabled !== action.options.instant_search_enabled &&
					action.options.isUpdatingOptions,
			};
	}
	return state;
};

export default jetpackSettings;
