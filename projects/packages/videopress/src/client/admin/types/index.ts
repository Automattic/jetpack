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
	 * Video poster image URL
	 */
	posterImage?: string;
	/**
	 * Video uploaded date
	 */
	uploadDate: string;
	/**
	 * Video duration, in milliseconds
	 */
	duration?: number;
	/**
	 * Plays counter
	 */
	plays?: number;
	/**
	 * Whether the video is private, or not.
	 */
	isPrivate?: boolean;
};

export type VideoPressVideo = Omit< OriginalVideoPressVideo, 'videoTitle' > & {
	/**
	 * Video title
	 */
	title: string;
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
