import { wpcomV2VideopressPostMetaEndpointBodyProps } from '../../../types';
import { videoDataProps } from '../use-video-data/types';

export type UseSyncMediaProps = {
	forceInitialState: ( data: wpcomV2VideopressPostMetaEndpointBodyProps ) => void;
	videoData: videoDataProps;
	isRequestingVideoData: boolean;
};
