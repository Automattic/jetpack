import { SET_AUTHENTICATED, SetAuthenticatedAction } from './actions';
import { AuthState, initialAuthState } from './types';

export default (
	state: AuthState = initialAuthState,
	action: SetAuthenticatedAction
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
		default:
			return state;
	}
};
