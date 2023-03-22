/**
 * WordPress dependencies
 */
import { BlockInstance } from '@wordpress/blocks';
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

export type NativePlayerProps = {
	html: string;
	isRequestingEmbedPreview: boolean;
	isSelected: boolean;
	clientId: string;
	insertBlocksAfter: ( blocks: BlockInstance[] ) => void;
};
