/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import icon from '../icon';
import { getIconColor } from '../../../shared/block-icons';

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
		src: icon,
		foreground: getIconColor(),
	},
	category: 'jetpack',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
