import { SET_JETPACK_SETTINGS } from '../actions/jetpack-settings';

const jetpackSettings = ( state = { showNudge: true }, action ) => {
	switch ( action.type ) {
		case SET_JETPACK_SETTINGS:
			return {
				...state,
				...action.options,
			};
	}
	return state;
};

export default jetpackSettings;
