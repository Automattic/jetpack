/**
 * External dependencies
 */
import { TrackProps, VideoGUIDProp, VideoIdProp } from '../../blocks/video/types';

export type UseVideoDataArgumentsProps = {
	id?: VideoIdProp;
	guid?: VideoGUIDProp;
	isPrivate?: boolean;
};

export type VideoDataProps = {
	title?: string;
	description?: string;
	tracks?: Array< TrackProps >;
};

export type UseVideoDataProps = {
	videoData: VideoDataProps;
	isRequestingVideoData: boolean;
};
