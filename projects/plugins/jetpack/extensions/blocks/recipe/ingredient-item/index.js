/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import icon from '../icon';
import { getIconColor } from '../../../shared/block-icons';

export const name = 'recipe-ingredient-item';
export const title = __( 'Recipe Ingredient Item', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'A single ingredient associated with a recipe.', 'jetpack' ) }</p>
		</Fragment>
	),
	keywords: [],
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'jetpack',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
