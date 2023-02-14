import { VideoGUID, VideoId } from './block-editor/blocks/video/types';

/*
 * Video Privacy:
 * '0': public
 * '1': private
 * '2': site default
 */
export type PrivacySettingProp = 0 | 1 | 2;

export type RatingProp = 'G' | 'PG-13' | 'R-17';

export type VideoTracksResponseBodyProps = {
	captions?: {
		en: {
			src: string;
			label: string;
		};
	};
	chapters?: {
		en: {
			src: string;
			label: string;
		};
	};
};

type STDVideoFileProps = {
	mp4: string;
	original_img: string;
	thumbnail_img: string;
};

type AVC240VideoFileProps = {
	mp4: string;
	original_img: string;
	thumbnail_img: string;
	hls: string;
	dash: string;
};

type DVDVideoFileProps = {
	mp4: string;
	original_img: string;
	thumbnail_img: string;
	hls: string;
	dash: string;
};

type HDVideoFileProps = {
	mp4: string;
	original_img: string;
	thumbnail_img: string;
	hls: string;
	dash: string;
};

export type WPComV2VideopressGetMetaEndpointResponseProps = {
	code: string;
	data: 200 | number; // <- check other data variants
	message: string;
};

export type WPComV2VideopressPostMetaEndpointBodyProps = {
	title?: string;
	description?: string;
	privacy_setting?: PrivacySettingProp;
};

/*
 * wp/v2/media/${ id }
 */
export type WPV2mediaGetEndpointResponseProps = {
	source_url: string;
	jetpack_videopress?: {
		guid: VideoGUID;
		title: string;
		description: string;
		caption: string;
		allow_download: 0 | 1;
		display_embed: 0 | 1;
		needs_playback_token: boolean;
		privacy_setting: PrivacySettingProp;
		rating: RatingProp;
	};
	media_details: {
		videopress?: {
			is_private: boolean;
		};
	};
};

/*
 * https://public-api.wordpress.com/rest/v1.1/videos/${ guid }
 */
export type WPCOMRestAPIVideosGetEndpointRequestArguments = {
	metadata_token?: string;
	birth_day?: string;
	birth_month?: string;
	birth_year?: string;
};

export type WPCOMRestAPIVideosGetEndpointResponseProps = {
	// source_url: string;

	guid: VideoGUID;
	title: string;
	description: string;
	width: number;
	height: number;
	duration: number;
	allow_download: boolean;
	display_embed: boolean;
	rating: RatingProp;

	/*
	 * Video Thumbnail
	 * https://videos.files.wordpress.com/guid/video-image.ext"
	 */
	poster: string;

	/*
	 * Original video
	 * https://videos.files.wordpress.com/guid/video-filename.ext"
	 */
	original: string;

	watermark: boolean;

	jetpack_videopress?: {
		caption: string;
		needs_playback_token: boolean;
		privacy_setting: PrivacySettingProp;
		rating: RatingProp;
	};

	bg_color: boolean;

	files: {
		std: STDVideoFileProps;
		avc_240p: AVC240VideoFileProps;
		dvd: DVDVideoFileProps;
		hd: HDVideoFileProps;
	};

	file_url_base: {
		http: string;
		https: string;
	};

	blog_id: number;
	post_id: number;
	is_private: boolean;
	privacy_setting: PrivacySettingProp;
	private_enabled_for_site: boolean;
	upload_date: string;
	finished: boolean;
	files_status: {
		std: {
			mp4: 'DONE' | string;
			ogg: 'DONE' | string;
		};
		avc_240p: {
			mp4: 'DONE' | string;
		};
		dvd: {
			mp4: 'DONE' | string;
		};
		hd: {
			mp4: 'DONE' | string;
		};

		hd_1080p: null;
		hd_1080p_compat: null;
		hevc_1440p: null;
		vp9_1440p: null;
		hevc_2160p: null;
		vp9_2160p: null;
	};

	subtitles: Array< string >;
	tracks: VideoTracksResponseBodyProps;

	adaptive_streaming: string;
	format_meta: {
		std: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		avc_240p: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		dvd: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		hd: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		hd_1080p: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		hevc_1440p: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		vp9_1440p: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		hevc_2160p: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
		vp9_2160p: {
			codec: string;
			label: string;
			vertical_lines: number;
		};
	};

	thumbnails_grid: {
		grid_interval: number;
		grid_width: number;
		grid_height: number;
		thumbs_height: number;
		files: Array< {
			file: string;
			start_time_ms: number;
			end_time_ms: number;
			thumbs_count: number;
		} >;
	};

	thumbnail_generating: boolean;
};

type VideoMimeTypeProp = 'video/videopress' | 'video/mp4' | 'video/ogg' | 'video/webm' | string;

/*
 * Admin Ajax
 * action: query-attachments
 * post item
 * query[post_mime_type][]: video
 */
export type AdminAjaxQueryAttachmentsResponseItemProps = {
	alt: string;
	author: string;
	authorLink: string;
	authorName: string;
	caption: string;
	compat: {
		item: string;
		meta: string;
	};
	context: string;
	date: number;
	dateFormatted: string;
	description: string;
	editLink: string;
	filename: string;
	height: number;
	icon: string;
	id: VideoId;
	image: {
		src: string;
		width: number;
		height: number;
	};
	link: string;
	menuOrder: number;
	meta: {
		artist: boolean;
		album: boolean;
		bitrate: boolean;
		bitrate_mode: boolean;
	};
	mime: VideoMimeTypeProp;
	modified: number;
	name: string;
	nonces: {
		update: string;
		delete: string;
		edit: string;
	};
	status: string;
	subtype: string;
	thumb: {
		src: string;
		width: number;
		height: number;
	};
	title: string;
	type: 'video' | string;
	uploadedTo: number;
	url: string;
	videopress_guid: Array< VideoGUID >;
	width: number;
};

export type AdminAjaxQueryAttachmentsResponseProps = {
	data: Array< AdminAjaxQueryAttachmentsResponseItemProps >;
	succes: boolean;
};
