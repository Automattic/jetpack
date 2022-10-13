/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import metadata from './block.json';
import { VideoPressIcon as icon } from './components/icons';
import Edit from './edit';
import save from './save';
import './style.scss';

export const { name, title, description } = metadata;

registerBlockType( name, {
	edit: Edit,
	save,
	icon,
} );
