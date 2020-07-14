/**
 * WordPress dependencies
 */
import { registerBlockStyle } from '@wordpress/blocks';
import './view.js';

registerBlockStyle( 'core/gallery', [
	{
		name: 'tiled',
		label: 'Tiled',
	},
	{
		name: 'standard',
		label: 'Standard',
	},
] );
