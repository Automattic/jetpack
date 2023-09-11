import { MediaSource } from '../media-service/types';
export const SET_AUTHENTICATED = 'SET_AUTHENTICATED';

export type SetAuthenticatedAction = {
	type: typeof SET_AUTHENTICATED;
	payload: {
		isAuthenticated: boolean;
		mediaSource: MediaSource;
	};
};

export default {
	setAuthenticated: ( mediaSource: MediaSource, isAuthenticated: boolean ) => {
		return {
			type: SET_AUTHENTICATED,
			payload: { isAuthenticated, mediaSource },
		};
	},
};
