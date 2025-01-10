/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { settings, name } from '.';
import { name as carouselBlockName } from '../carousel';
import { registerQueryStore } from './store';

const BLOCK_NAME = `newspack-blocks/${ name }`;

registerBlockType( BLOCK_NAME, settings );
registerQueryStore( [ BLOCK_NAME, `newspack-blocks/${ carouselBlockName }` ] );

// Fetch CSS and insert it in a style tag.
apiFetch( {
	path: '/newspack-blocks/v1/homepage-articles-css',
} ).then( css => {
	const style = document.createElement( 'style' );
	style.innerHTML = css;
	style.id = 'newspack-blocks-homepage-articles-styles';
	document.head.appendChild( style );
} );
