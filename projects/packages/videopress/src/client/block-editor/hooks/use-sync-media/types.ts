import { WPComV2VideopressPostMetaEndpointBodyProps } from '../../../types';
import { TrackProps } from '../../blocks/video/types';
import { VideoDataProps } from '../use-video-data/types';

export type UseSyncMedia = {
	forceInitialState: ( data: WPComV2VideopressPostMetaEndpointBodyProps ) => void;
	videoData: VideoDataProps;
	isRequestingVideoData: boolean;
	error: object | null;
	isOverwriteChapterAllowed: boolean;
	isGeneratingPoster: boolean;
	videoBelongToSite: boolean;
};

export type ArrangeTracksAttributesProps = [ Array< TrackProps >, boolean ];
