/**
 * External dependencies
 */
import { VideoBlockAttributes, VideoPreviewProps } from '../../types';

export type PlayerProps = {
	showCaption: boolean;
	html: string;
	isSelected: boolean;
	attributes: VideoBlockAttributes;
	setAttributes: ( attributes: VideoBlockAttributes ) => void;
	preview: VideoPreviewProps;
	isRequestingEmbedPreview: boolean;
};
