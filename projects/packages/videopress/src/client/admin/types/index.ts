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
	 * Video title (used internally)
	 */
	title: string;
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
	 * Video URL
	 */
	url?: string;
	/**
	 * Whether the video is private, or not.
	 */
	isPrivate?: boolean;
	/**
	 * Object reflecting poster image data.
	 */
	image?: {
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
