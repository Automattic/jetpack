import { trackKindOptionProps } from '../../plugins/video-chapters/utils/tracks-editor/types';

export type videoId = number;

type track = {
	label: string;
	srcLang: string;
	kind: trackKindOptionProps;
	src: string;
};

export type videoBlockColorAttributesProps = {
	seekbarPlayedColor?: string;
	seekbarLoadingColor?: string;
	seekbarColor?: string;
};

export type videoBlockAttributes = videoBlockColorAttributesProps & {
	id?: videoId;
	guid?: string;
	src?: string;
	poster?: string;
	videoRatio?: number;
	tracks?: Array< track >;

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

	useAverageColor?: boolean;

	// Privacy and Rating types
	privacySetting?: number;
	rating?: string;
};

export type videoBlockSetAttributesProps = ( attributes: videoBlockAttributes ) => void;

export type videoControlProps = {
	/**
	 * Block Attributes object.
	 */
	attributes: videoBlockAttributes;

	setAttributes: videoBlockSetAttributesProps;
};

export type VideoEditProps = videoControlProps;
