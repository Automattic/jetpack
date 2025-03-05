/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { settings, name } from '.';
import { name as carouselBlockName } from '../carousel';
import { registerQueryStore } from './store';

const BLOCK_NAME = `newspack-blocks/${ name }`;

registerBlockType( BLOCK_NAME, settings );
registerQueryStore( [ BLOCK_NAME, `newspack-blocks/${ carouselBlockName }` ] );
