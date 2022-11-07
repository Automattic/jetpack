type Track = {
	items: object;
};

export type BlockAttributes = {
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
};

export type PlaybackControlProps = {
	/**
	 * Block Attributes object.
	 */
	attributes: BlockAttributes;

	setAttributes: ( attributes: BlockAttributes ) => void;
};
