import { WPComV2VideopressPostMetaEndpointBodyProps } from '../../../types';
import { TrackProps } from '../../blocks/video/types';
import { VideoDataProps } from '../use-video-data/types';

export type UseSyncMediaProps = {
	forceInitialState: ( data: WPComV2VideopressPostMetaEndpointBodyProps ) => void;
	videoData: VideoDataProps;
	isRequestingVideoData: boolean;
	error: object | null;
	isOverwriteChapterAllowed: boolean;
};

export type ArrangeTracksAttributesProps = [ Array< TrackProps >, boolean ];
