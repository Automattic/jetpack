import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import { HeroIcon } from '../icon';
import edit from './edit';
import save from './save';

export const name = 'recipe-hero';
export const title = __( 'Recipe Hero', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'Image area for the recipe.', 'jetpack' ) }</p>
		</Fragment>
	),
	keywords: [],
	icon: {
		src: HeroIcon,
		foreground: getIconColor(),
	},
	category: 'embed',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
