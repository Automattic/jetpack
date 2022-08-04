/**
 * External dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import save from './save';
import './style.scss';

/**
 * Register VideoPress block
 *
 */
registerBlockType( metadata.name, {
	edit: Edit,
	save,
} );
