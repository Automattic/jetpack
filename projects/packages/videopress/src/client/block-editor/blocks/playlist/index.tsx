/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
// Overrides Webpack's publicPath before any lazy chunk loads on wpcom.
import '../../set-webpack-public-path';
import { VideoPressIcon as icon } from '../video/components/icons';
import metadata from './block.json';
import Edit from './edit';
/**
 * Types
 */
import type { PlaylistAttributes } from './types';

export const { name, title, description, attributes, category } = metadata;

registerBlockType< PlaylistAttributes >( name, {
	edit: Edit,
	category,
	title,
	icon,
	// Dynamic block: only the title heading inner block is saved; the rest of
	// the markup is produced by Initializer::render_videopress_playlist_block().
	save: () => <InnerBlocks.Content />,
	attributes,
} );
