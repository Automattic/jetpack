import {
	SET_AUTHENTICATED,
	MEDIA_PHOTOS_PICKER_SESSION_SET,
	SetAuthenticatedAction,
	MediaPhotosPickerSessionAction,
} from './actions';
import { AuthState, initialAuthState } from './types';

export default (
	state: AuthState = initialAuthState,
	action: SetAuthenticatedAction | MediaPhotosPickerSessionAction
): AuthState => {
	switch ( action.type ) {
		case SET_AUTHENTICATED:
			return {
				...state,
				mediaSourceIsAuthenticated: state.mediaSourceIsAuthenticated.set(
					action.payload.mediaSource,
					action.payload.isAuthenticated
				),
			};

		case MEDIA_PHOTOS_PICKER_SESSION_SET:
			return {
				...state,
				mediaPhotosPickerSession: action.payload,
			};

		default:
			return state;
	}
};
