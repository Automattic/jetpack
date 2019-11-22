/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import { StarIcon, StarBlockIcon } from './icon';
import './editor.scss';
import './style.scss';

export const name = 'jetpack/rating-star';

export const settings = {
	title: 'Star Rating',
	description: __(
		'Rate movies, books, songs, recipes — anything you can put a number on.',
		'jetpack'
	),
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
};
