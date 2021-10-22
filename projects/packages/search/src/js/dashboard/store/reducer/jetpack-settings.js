import { SET_JETPACK_SETTINGS } from '../actions/jetpack-settings';

const jetpackSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_JETPACK_SETTINGS:
			return {
				...state,
				search: action.options?.search,
				instant_search_enabled: action.options?.instant_search_enabled,
			};
	}
	return state;
};

export default jetpackSettings;
