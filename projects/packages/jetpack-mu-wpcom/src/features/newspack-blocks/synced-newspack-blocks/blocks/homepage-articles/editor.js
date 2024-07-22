/**
 * Internal dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { name as carouselBlockName } from '../carousel';
import { registerQueryStore } from './store';
import { settings, name } from '.';

const BLOCK_NAME = `newspack-blocks/${ name }`;

registerBlockType( BLOCK_NAME, settings );
registerQueryStore( [ BLOCK_NAME, `newspack-blocks/${ carouselBlockName }` ] );
