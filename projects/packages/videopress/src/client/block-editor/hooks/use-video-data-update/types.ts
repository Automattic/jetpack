import { WPComV2VideopressPostMetaEndpointBodyProps } from '../../../types';
import { videoDataProps } from '../use-video-data/types';

export type UseSyncMediaProps = {
	forceInitialState: ( data: WPComV2VideopressPostMetaEndpointBodyProps ) => void;
	videoData: videoDataProps;
	isRequestingVideoData: boolean;
};
