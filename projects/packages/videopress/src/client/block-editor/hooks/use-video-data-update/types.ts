import { WPComV2VideopressPostMetaEndpointBodyProps } from '../../../types';
import { VideoDataProps } from '../use-video-data/types';

export type UseSyncMediaOptionsProps = {
	/*
	 * Define if the chapters file is auto-generated
	 */
	isAutoGeneratedChapter: boolean;
};

export type UseSyncMediaProps = {
	forceInitialState: ( data: WPComV2VideopressPostMetaEndpointBodyProps ) => void;
	videoData: VideoDataProps;
	isRequestingVideoData: boolean;
};
