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

export type VideoPressVideo = {
	id: number | string;
	videoTitle: string;
	uploadDate: string;
	posterImage?: string;
	duration?: number;
	plays?: number;
	isPrivate?: boolean;
};

export type LocalVideo = Omit<
	VideoPressVideo,
	'posterImage' | 'duration' | 'plays' | 'isPrivate'
>;

export interface ConnectionStore {
	getConnectionStatus: () => {
		isUserConnected: boolean;
		isRegistered: boolean;
	};
}
