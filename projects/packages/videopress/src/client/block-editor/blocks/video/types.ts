type Track = {
	items: object;
};

export type VideoBlockAttributes = {
	id?: number;
	guid?: string;
	src?: string;
	poster?: string;
	videoRatio?: number;
	tracks?: Track[];

	// Playback types
	autoplay?: boolean;
	caption?: string;
	controls?: boolean;
	loop?: boolean;
	muted?: boolean;
	playsinline?: boolean;
	preload?: string;

	// Rendering types
	cacheHtml?: string;
	maxWidth?: string;

	// Colors types
	seekbarPlayedColor?: string;
	seekbarLoadingColor?: string;
	seekbarColor?: string;
	useAverageColor?: boolean;

	// Privacy and Rating types
	privacySetting?: number;
};

export type VideoControlProps = {
	/**
	 * Block Attributes object.
	 */
	attributes: VideoBlockAttributes;

	setAttributes: ( attributes: VideoBlockAttributes ) => void;
};
