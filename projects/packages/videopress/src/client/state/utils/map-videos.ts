/**
 * Internal dependencies
 */
import { OriginalVideoPressVideo, VideoPressVideo } from '../../admin/types';

export const mapVideoFromWPV2MediaEndpoint = (
	video: OriginalVideoPressVideo
): VideoPressVideo => {
	const {
		media_details: mediaDetails,
		id,
		jetpack_videopress: jetpackVideoPress,
		jetpack_videopress_guid: guid,
	} = video;

	const { videopress: videoPressMediaDetails, width, height } = mediaDetails;

	const {
		title,
		description,
		caption,
		rating,
		allow_download: allowDownload,
		display_embed: displayEmbed,
		privacy_setting: privacySetting,
		needs_playback_token: needsPlaybackToken,
		is_private: isPrivate,
	} = jetpackVideoPress;

	const {
		original: url,
		poster,
		upload_date: uploadDate,
		duration,
		file_url_base: fileURLBase,
		finished,
		files = {
			dvd: {
				original_img: '',
			},
		},
	} = videoPressMediaDetails || {};

	const { dvd } = files;

	/*
	 * Define thumbnail picking the image from DVD file type
	 * Issue: https://github.com/Automattic/jetpack/issues/26319
	 */
	const thumbnail = dvd?.original_img ? `${ fileURLBase.https }${ dvd.original_img }` : undefined;

	const filename = url?.split( '/' ).slice( -1 )[ 0 ];

	return {
		id,
		guid,
		title,
		description,
		caption,
		url,
		uploadDate,
		duration,
		isPrivate,
		posterImage: poster,
		allowDownload,
		displayEmbed,
		rating,
		privacySetting,
		needsPlaybackToken,
		width,
		height,
		poster: {
			src: poster,
		},
		thumbnail,
		finished,
		filename,
	};
};

export const mapVideosFromWPV2MediaEndpoint = (
	videos: OriginalVideoPressVideo[]
): VideoPressVideo[] => {
	return videos?.map?.( mapVideoFromWPV2MediaEndpoint );
};

export const mapLocalVideoFromWPV2MediaEndpoint = (
	video: OriginalVideoPressVideo
): VideoPressVideo => {
	const {
		media_details: mediaDetails,
		id,
		jetpack_videopress: jetpackVideoPress,
		source_url: url,
		date: uploadDate,
	} = video;

	const { width, height, length: duration } = mediaDetails;

	const { title, description, caption } = jetpackVideoPress;

	return {
		id,
		title,
		description,
		caption,
		width,
		height,
		url,
		uploadDate,
		duration,
	};
};

export const mapLocalVideosFromWPV2MediaEndpoint = (
	videos: OriginalVideoPressVideo[]
): VideoPressVideo[] => {
	return videos.map( mapLocalVideoFromWPV2MediaEndpoint );
};
