/**
 * External dependencies
 */
import { gmdateI18n } from '@wordpress/date';
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

export const mapVideos = ( videos: OriginalVideoPressVideo[] ): VideoPressVideo[] => {
	return videos.map( mapVideo );
};

export const mapVideoFromWPV2MediaEndpoint = (
	video: OriginalVideoPressVideo
): VideoPressVideo => {
	const { media_details: mediaDetails, id, caption, jetpack_videopress_guid: guid } = video;

	const { videopress: videoPressMediaDetails, width, height } = mediaDetails;

	const {
		title,
		description,
		original: url,
		poster,
		upload_date: date,
		duration,
		is_private: isPrivate,
		file_url_base: fileURLBase,
		files,
	} = videoPressMediaDetails;

	const { dvd } = files;

	// Pick poster image from dvd file type.
	const dvdImage = `${ fileURLBase.https }${ dvd.original_img }`;

	return {
		id,
		guid,
		title,
		description,
		caption,
		url,
		posterImage: poster,
		date,
		duration,
		isPrivate,
		dateFormatted: gmdateI18n( 'F j, Y', date ),
		image: {
			src: dvdImage,
			width,
			height,
		},
	};
};

export const mapVideosFromWPV2MediaEndpoint = (
	videos: OriginalVideoPressVideo[]
): VideoPressVideo => {
	return videos.map( mapVideoFromWPV2MediaEndpoint );
};
