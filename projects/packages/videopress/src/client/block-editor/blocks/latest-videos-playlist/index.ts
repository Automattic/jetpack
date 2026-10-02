/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { createElement } from '@wordpress/element';
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
import type { LatestVideosPlaylistAttributes } from './types';

export const { name, title, description, attributes, category } = metadata;

registerBlockType< LatestVideosPlaylistAttributes >( name, {
	edit: Edit,
	category,
	title,
	icon,
	// Only the locked inner Video Playlist block is serialized; the markup is
	// produced by the render callback in
	// Initializer::render_videopress_latest_videos_playlist_block().
	save: () => createElement( InnerBlocks.Content ),
	attributes,
} );
