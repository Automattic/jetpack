import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import { RecipeStepsIcon } from '../icon';
import attributes from './attributes';
import edit from './edit';
import save from './save';

import './editor.scss';

export const name = 'recipe-steps';
export const title = __( 'Recipe Steps', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'Step by step instructions for the recipe.', 'jetpack' ) }</p>
		</Fragment>
	),
	keywords: [],
	icon: {
		src: RecipeStepsIcon,
		foreground: getIconColor(),
	},
	category: 'embed',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
