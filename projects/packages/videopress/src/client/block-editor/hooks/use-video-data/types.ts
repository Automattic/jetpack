/**
 * External dependencies
 */
import { VideoGUID, VideoId } from '../../blocks/video/types';

export type UseVideoDataArgumentsProps = {
	id?: VideoId;
	guid?: VideoGUID;
	isPrivate?: boolean;
};

type TrackProps = {
	src: string;
	kind: string;
	srcLang: string;
	label: string;
};

export type videoDataProps = {
	title?: string;
	description?: string;
	tracks: Array< TrackProps >;
};

export type UseVideoDataProps = {
	videoData: videoDataProps;
	isRequestingVideoData: boolean;
};
