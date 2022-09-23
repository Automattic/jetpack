/**
 * Internal dependencies
 */
import { OriginalVideoPressVideo, VideoPressVideo } from '../types';

export const mapVideo = ( video: OriginalVideoPressVideo ): VideoPressVideo => {
	return {
		...video,
		title: video.title,
		posterImage: video.image?.src,
		uploadDate: video?.dateFormatted,
	};
};

// Probably @deprecated since it was used when hitting the admin-ajax endpoint
export const mapVideos = ( videos: OriginalVideoPressVideo[] ): VideoPressVideo[] => {
	return videos.map( mapVideo );
};

export const mapVideoFromWPV2MediaEndpoint = (
	video: OriginalVideoPressVideo
): VideoPressVideo => {
	const {
		media_details: mediaDetails,
		id,
		caption,
		jetpack_videopress: jetpackVideoPress,
		jetpack_videopress_guid: guid,
	} = video;

	const { videopress: videoPressMediaDetails, width, height } = mediaDetails;

	const {
		allow_download: allowDownload,
		description,
		privacy_setting: privacySetting,
		rating,
		title,
	} = jetpackVideoPress;

	const {
		original: url,
		poster,
		upload_date: uploadDate,
		duration,
		is_private: isPrivate,
		file_url_base: fileURLBase,
		files,
	} = videoPressMediaDetails;

	const { dvd } = files;

	/*
	 * Define thumbnail picking the image from DVD file type
	 * Issue: https://github.com/Automattic/jetpack/issues/26319
	 */
	const thumbnail = dvd?.original_img ? `${ fileURLBase.https }${ dvd.original_img }` : undefined;

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
		rating,
		privacySetting,
		poster: {
			src: poster,
			width,
			height,
		},
		thumbnail,
	};
};

export const mapVideosFromWPV2MediaEndpoint = (
	videos: OriginalVideoPressVideo[]
): VideoPressVideo => {
	return videos.map( mapVideoFromWPV2MediaEndpoint );
};
