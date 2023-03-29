/**
 * WordPress dependencies
 */
import { BlockInstance } from '@wordpress/blocks';

export type NativePlayerProps = {
	html: string;
	isRequestingEmbedPreview: boolean;
	isSelected: boolean;
	clientId: string;
	insertBlocksAfter: ( blocks: BlockInstance[] ) => void;
};
