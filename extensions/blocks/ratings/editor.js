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
import { StarIcon, StarBlockIcon, ChiliIcon, MoneyIcon } from './icon';
import './editor.scss';
import './style.scss';

const category = 'jetpack';

const attributes = {
	rating: {
		type: 'number',
		default: 1,
	},
	maxRating: {
		type: 'number',
		default: 5,
	},
	color: {
		type: 'text',
	},
	align: {
		type: 'text',
		default: 'left',
	},
};

registerBlockType( 'jetpack/rating-star', {
	title: 'Star Rating',
	description: __( 'Rate movies, books, songs, recipes — anything you can put a number on.' ),
	icon: StarBlockIcon,
	category,
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
	attributes,
	edit: edit( StarIcon ),
	save: save( '★' ), // Fallback symbol if the block is removed or the render_callback deactivated.
} );

registerBlockType( 'jetpack/rating-spiciness', {
	title: 'Spiciness Rating',
	description: __( 'Rate the spiciness of recipes, meals, and other spicy things.' ),
	icon: ChiliIcon,
	example: {},
	category,
	attributes,
	edit: edit( ChiliIcon ),
	save: save( '🌶' ), // Fallback symbol if the block is removed or the render_callback deactivated.
} );

registerBlockType( 'jetpack/rating-priciness', {
	title: 'Price Range',
	description: __( 'Show how expensive something is.' ),
	icon: MoneyIcon,
	category,
	example: {},
	attributes: {
		...attributes,
		maxRating: {
			type: 'number',
			default: 4,
		},
	},
	edit: edit( MoneyIcon ),
	save: save( '💲' ), // Fallback symbol if the block is removed or the render_callback deactivated
} );
