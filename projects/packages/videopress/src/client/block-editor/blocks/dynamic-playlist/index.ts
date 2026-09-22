/**
 * WordPress dependencies
 */
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
import type { DynamicPlaylistAttributes } from './types';

export const { name, title, description, attributes, category } = metadata;

registerBlockType< DynamicPlaylistAttributes >( name, {
	edit: Edit,
	category,
	title,
	icon,
	// Dynamic block: the markup is produced by the render callback in
	// Initializer::render_videopress_dynamic_playlist_block().
	save: () => null,
	attributes,
} );
