import { MediaSource } from '../media-service/types';
import { PickerSession } from './types';

export const SET_AUTHENTICATED = 'SET_AUTHENTICATED';
export const MEDIA_PHOTOS_PICKER_SESSION_SET = 'MEDIA_PHOTOS_PICKER_SESSION_SET';

export type SetAuthenticatedAction = {
	type: typeof SET_AUTHENTICATED;
	payload: {
		isAuthenticated: boolean;
		mediaSource: MediaSource;
	};
};

export type MediaPhotosPickerSessionAction = {
	type: typeof MEDIA_PHOTOS_PICKER_SESSION_SET;
	payload: PickerSession;
};

export default {
	setAuthenticated: ( mediaSource: MediaSource, isAuthenticated: boolean ) => {
		return {
			type: SET_AUTHENTICATED,
			payload: { isAuthenticated, mediaSource },
		};
	},

	mediaPhotosPickerSessionSet: ( session: PickerSession ) => {
		return {
			type: MEDIA_PHOTOS_PICKER_SESSION_SET,
			payload: session,
		};
	},
};
