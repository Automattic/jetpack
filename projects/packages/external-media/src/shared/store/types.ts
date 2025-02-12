import { MediaSource } from '../media-service/types';

export type AuthState = {
	mediaSourceIsAuthenticated: Map< MediaSource, boolean >;
	mediaPhotosPickerSession: PickerSession;
};

export type PickerSession = {
	id: string;
	mediaItemsSet: boolean;
	pickerUri: string;
	pollingConfig: {
		pollInterval: string;
		timeoutIn: string;
	};
	expireTime: string;
};

export const initialAuthState: AuthState = {
	mediaPhotosPickerSession: null,
	mediaSourceIsAuthenticated: new Map( [
		[ MediaSource.Pexels, false ],
		[ MediaSource.GooglePhotos, false ],
		[ MediaSource.Openverse, false ],
		[ MediaSource.Unknown, false ],
	] ),
};
