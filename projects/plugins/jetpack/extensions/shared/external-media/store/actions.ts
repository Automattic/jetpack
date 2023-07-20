export const SET_AUTHORIZED = 'SET_AUTHORIZED';

export type SetAuthorizedAction = {
	type: typeof SET_AUTHORIZED;
	payload: boolean;
};

export default {
	setAuthorized: ( isAuthorized: boolean ) => {
		return {
			type: SET_AUTHORIZED,
			payload: isAuthorized,
		};
	},
};
