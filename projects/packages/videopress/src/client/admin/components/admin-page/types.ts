import type { VideoPressVideo } from '../video-row';

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
		jetpackVideoPressInitialState: {
			apiNonce: string;
			apiRoot: string;
			registrationNonce: string;
		};
	}
}

export type LocalVideo = Omit<
	VideoPressVideo,
	'posterImage' | 'duration' | 'plays' | 'isPrivate'
>;

export type VideoPressLibraryProps = { videos: Array< VideoPressVideo > };

export type LocalVideoLibraryProps = { videos: Array< LocalVideo > };

export interface ConnectionStore {
	getConnectionStatus: () => {
		isUserConnected: boolean;
		isRegistered: boolean;
	};
}
