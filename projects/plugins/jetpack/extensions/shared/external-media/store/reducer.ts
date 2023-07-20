import { SET_AUTHORIZED, SetAuthorizedAction } from './actions';
import { AuthState, initialAuthState } from './types';

export default ( state: AuthState = initialAuthState, action: SetAuthorizedAction ): AuthState => {
	switch ( action.type ) {
		case SET_AUTHORIZED:
			return { ...state, isAuthorized: action.payload };
		default:
			return state;
	}
};
