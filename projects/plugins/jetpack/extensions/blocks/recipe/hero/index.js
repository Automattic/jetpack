import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import icon from '../icon';
import edit from './edit';
import save from './save';

export const name = 'recipe-hero';
export const title = __( 'Recipe Hero', 'jetpack' );
export const settings = {
	title,
	description: __( 'Image area for the recipe.', 'jetpack' ),
	keywords: [],
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'widgets',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
