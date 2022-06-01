import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import icon from '../icon';
import attributes from './attributes';
import edit from './edit';
import save from './save';

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
