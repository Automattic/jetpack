import { VideoPressVideo } from '../../types';

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
		jetpackVideoPressInitialState: {
			apiNonce: string;
			apiRoot: string;
			registrationNonce: string;
			paidFeatures: {
				isVideoPressSupported: boolean;
				isVideoPress1TBSupported: boolean;
				isVideoPressUnlimitedSupported: boolean;
			};
			adminUrl: string;
		};
	}
}

export type VideoLibraryProps = {
	videos: Array< VideoPressVideo >;
	totalVideos?: number;
};

export interface ConnectionStore {
	getConnectionStatus: () => {
		isUserConnected: boolean;
		isRegistered: boolean;
	};
}
