/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from '../video/components/icons';
import metadata from './block.json';
// Shared block structure, imported before ./edit so the editor-only rules
// that editor.scss (imported by ./edit) layers on top win the cascade.
import './style.scss';
import Edit from './edit';
/**
 * Types
 */
import type { PlaylistBlockAttributes } from './edit';

export const { name, title, description, attributes, category } = metadata;

/*
 * Dynamic block: the markup is produced server side by
 * Playlist_Block::render() (src/class-playlist-block.php), because playlist
 * membership, order, and metadata are mutable server state that would go
 * stale in static markup. `save` therefore persists attributes only.
 */
registerBlockType< PlaylistBlockAttributes >( name, {
	edit: Edit,
	category,
	title,
	save: () => null,
	icon,
	attributes,
} );
