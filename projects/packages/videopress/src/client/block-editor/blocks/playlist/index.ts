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
import type { PlaylistBlockAttributes } from './types';

export const { name, title, description, attributes, category } = metadata;

registerBlockType< PlaylistBlockAttributes >( name, {
	edit: Edit,
	save: () => null,
	category,
	title,
	icon,
	attributes,
} );
