/**
 * External dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import { StarIcon, StarBlockIcon } from './icon';
import './editor.scss';
import './style.scss';

registerBlockType( 'jetpack/rating-star', {
	title: 'Star Rating',
	description: __( 'Rate movies, books, songs, recipes — anything you can put a number on.' ),
	icon: StarBlockIcon,
	category: 'jetpack',
	example: {},
	styles: [
		{
			name: 'default',
			label: 'Default',
			isDefault: true,
		},
		{
			name: 'outlined',
			label: 'Outlined',
		},
	],
	attributes: {
		rating: {
			type: 'number',
			default: 1,
		},
		maxRating: {
			type: 'number',
			default: 5,
		},
		color: {
			type: 'string',
		},
		align: {
			type: 'string',
			default: 'left',
		},
	},
	edit: edit( StarIcon ),
	save: save( '★' ), // Fallback symbol if the block is removed or the render_callback deactivated.
} );
