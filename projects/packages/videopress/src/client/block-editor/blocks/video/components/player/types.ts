/**
 * External dependencies
 */
import { VideoBlockAttributes, VideoPreview } from '../../types';

export type PlayerProps = {
	showCaption: boolean;
	html: string;
	isSelected: boolean;
	attributes: VideoBlockAttributes;
	setAttributes: ( attributes: VideoBlockAttributes ) => void;
	scripts: string[];
	preview: VideoPreview;
	isRequestingEmbedPreview: boolean;
};
