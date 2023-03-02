/**
 * External dependencies
 */
import { VideoBlockAttributes } from '../../types';

export type PlayerProps = {
	html: string;
	isSelected: boolean;
	attributes: VideoBlockAttributes;
	setAttributes: ( attributes: VideoBlockAttributes ) => void;
	scripts: string[];
	preview: {
		height: number;
		html: string;
		provider_name: 'VideoPress';
		thumbnail_height: number;
		thumbnail_width: number;
		title: string;
		type: 'video';
		version: '1.0' | string;
		width: number;
	};
	isRequestingEmbedPreview: boolean;
};
