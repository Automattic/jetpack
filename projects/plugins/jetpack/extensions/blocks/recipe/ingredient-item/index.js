import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getClientBlockIconProp } from '../../../shared/get-block-icon-from-metadata';
import metadata from '../block.json';
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
	icon: getClientBlockIconProp( metadata ),
	category: 'widgets',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
