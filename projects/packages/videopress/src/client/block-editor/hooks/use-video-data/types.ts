/**
 * External dependencies
 */
import { PrivacySettingProp, RatingProp, VideoTracksResponseBodyProps } from '../../../types';
import { VideoGUID, VideoId } from '../../blocks/video/types';

export type UseVideoDataArgumentsProps = {
	id?: VideoId;
	guid?: VideoGUID;
	skipRatingControl: boolean;
	maybeIsPrivate: boolean;
};

export type VideoDataProps = {
	duration?: number;
	allow_download?: boolean;
	description?: string;
	display_embed?: boolean;
	filename?: string;
	guid?: VideoGUID;
	is_private?: boolean;
	post_id?: number;
	privacy_setting?: PrivacySettingProp;
	private_enabled_for_site?: boolean;
	rating?: RatingProp;
	title?: string;
	tracks?: VideoTracksResponseBodyProps;
};

export type UseVideoDataProps = {
	videoData: VideoDataProps;
	isRequestingVideoData: boolean;
	videoBelongToSite: boolean;
};
