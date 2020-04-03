/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import { StarIcon, StarBlockIcon } from './icon';
import './editor.scss';
import './style.scss';
import { supportsCollections } from '../../shared/block-category';

export const name = 'rating-star';

export const settings = {
	title: __( 'Star Rating', 'jetpack' ),
	description: __(
		'Rate movies, books, songs, recipes — anything you can put a number on.',
		'jetpack'
	),
	icon: StarBlockIcon,
	keywords: [
		_x( 'star', 'block search term', 'jetpack' ),
		_x( 'rating', 'block search term', 'jetpack' ),
		_x( 'review', 'block search term', 'jetpack' ),
	],
	category: supportsCollections() ? 'formatting' : 'jetpack',
	example: {},
	styles: [
		{
			name: 'filled',
			label: _x( 'Filled', 'block style', 'jetpack' ),
			isDefault: true,
		},
		{
			name: 'outlined',
			label: _x( 'Outlined', 'block style', 'jetpack' ),
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
