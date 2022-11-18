import { trackKindOptionProps } from '../../plugins/video-chapters/utils/tracks-editor/types';

export type VideoId = number;

type Track = {
	label: string;
	srcLang: string;
	kind: trackKindOptionProps;
	src: string;
};

export type VideoBlockColorAttributesProps = {
	seekbarPlayedColor?: string;
	seekbarLoadingColor?: string;
	seekbarColor?: string;
};

export type VideoBlockAttributes = VideoBlockColorAttributesProps & {
	id?: VideoId;
	guid?: string;
	src?: string;

	title?: string;
	description?: string;

	poster?: string;
	videoRatio?: number;
	tracks?: Array< Track >;

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
	allowDownload?: boolean;
	rating?: string;
};

export type VideoBlockSetAttributesProps = ( attributes: VideoBlockAttributes ) => void;

export type VideoControlProps = {
	/**
	 * Block Attributes object.
	 */
	attributes: VideoBlockAttributes;

	setAttributes: VideoBlockSetAttributesProps;

	isRequestingVideoData: boolean;
};

export type VideoEditProps = VideoControlProps;

export type DetailsPanelProps = VideoControlProps & {
	filename: string;
};
