/* Shared Types */

export type OriginalVideoPressVideo = {
	/**
	 * Video ID
	 */
	id: number | string;
	/**
	 * Video title
	 */
	videoTitle: string;
	/**
	 * Video description
	 */
	description: string;
	/**
	 * Video caption
	 */
	caption: string;
	/**
	 * Video filename
	 */
	filename: string;
	/**
	 * Video uploaded date in UTC
	 */
	date: number;
	/**
	 * Video uploaded date formatted
	 */
	dateFormatted: string;
	/**
	 * Video duration, in milliseconds
	 */
	duration?: number;

	/**
	 * Video rating
	 */
	rating?: 'G' | 'PG-13' | 'R-17';

	/**
	 * Plays counter
	 */
	plays?: number;
	/**
	 * Video URL
	 */
	url?: string;
	/**
	 * Whether the video is private, or not.
	 */
	isPrivate?: boolean;

	/**
	 * Whether is possible to download the video, or not.
	 */
	allowDownload?: boolean;

	/**
	 * Video poster image URL
	 */
	posterImage?: string;

	/**
	 * Video privacy setting:
	 * - 0 `public`: anyone can view the video
	 * - 1 `private`: only the owner can view the video
	 * - 2 `site-default`
	 */
	privacySetting?: 0 | 1 | 2;

	/**
	 * Object reflecting poster image data.
	 */
	poster?: {
		/**
		 * Video poster image URL
		 */
		src: string;
		/**
		 * Poster image width
		 */
		width: number;
		/**
		 * Poster image Height
		 */
		height: number;
	};

	/**
	 * Video thumbnail image URL
	 */
	thumbnail?: string;
};

export type VideoPressVideo = Omit< OriginalVideoPressVideo, 'videoTitle' > & {
	/**
	 * Video title
	 */
	title: string;
	/**
	 * VideoPress GUID
	 */
	guid?: string;
	/**
	 * Video upload date
	 */
	uploadDate: string;
};

export type LocalVideo = {
	/**
	 * Video title
	 */
	title: string;
	/**
	 * Video uploaded date
	 */
	uploadDate: string;
};

export type VideopressSelectors = {
	getVideo: ( id: number ) => VideoPressVideo;
	getVideos: () => VideoPressVideo[];
	getUploadedVideoCount: () => number;
};
