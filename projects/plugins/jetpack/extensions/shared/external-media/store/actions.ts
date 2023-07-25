export const SET_AUTHENTICATED = 'SET_AUTHENTICATED';

export type SetAuthenticatedAction = {
	type: typeof SET_AUTHENTICATED;
	payload: boolean;
};

export default {
	setAuthenticated: ( isAuthenticated: boolean ) => {
		return {
			type: SET_AUTHENTICATED,
			payload: isAuthenticated,
		};
	},
};
