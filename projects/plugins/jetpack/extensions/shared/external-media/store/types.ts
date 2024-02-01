import { MediaSource } from '../media-service/types';

export type AuthState = {
	mediaSourceIsAuthenticated: Map< MediaSource, boolean >;
};

export const initialAuthState: AuthState = {
	mediaSourceIsAuthenticated: new Map( [
		[ MediaSource.Pexels, false ],
		[ MediaSource.GooglePhotos, false ],
		[ MediaSource.Openverse, false ],
		[ MediaSource.Unknown, false ],
	] ),
};
