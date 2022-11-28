/**
 * External dependencies
 */
import { TrackProps, VideoGUID, VideoId } from '../../blocks/video/types';

export type UseVideoDataArgumentsProps = {
	id?: VideoId;
	guid?: VideoGUID;
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
