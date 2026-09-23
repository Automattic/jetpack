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
import './style.scss';
import Edit from './edit';
/**
 * Types
 */
import type { PlaylistsAttributes } from './types';

export const { name, title, description, attributes, category } = metadata;

registerBlockType< PlaylistsAttributes >( name, {
	edit: Edit,
	category,
	title,
	icon,
	// Dynamic block: the markup is produced by Channel::render_playlists_block().
	save: () => null,
	attributes,
} );
