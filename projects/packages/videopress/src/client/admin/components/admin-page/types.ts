import { LocalVideo, MetadataVideo, VideoPressVideo } from '../../types';

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
		jetpackVideoPressInitialState?: {
			allowedVideoExtensions: Record< string, string >;
			registrationNonce: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			siteProductData: any;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			productData?: any;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			productPrice?: any;
			contentNonce: string;
			initialState: {
				videos?: {
					isFetching?: boolean;
				};
			};
		};
	}
}

export type VideoLibraryProps = {
	videos: Array< VideoPressVideo & MetadataVideo >;
	totalVideos?: number;
	loading?: boolean;
};

export type LocalLibraryProps = {
	videos: Array< LocalVideo >;
	totalVideos?: number;
	loading?: boolean;
	uploading?: boolean;
	onUploadClick?: ( video: LocalVideo ) => void;
};

export interface ConnectionStore {
	getConnectionStatus: () => {
		isUserConnected: boolean;
		isRegistered: boolean;
	};
}
