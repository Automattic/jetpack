/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import icon from './icon';
import { getIconColor } from '../../../shared/block-icons';

export const name = 'recipe-ingredient-item';
export const title = __( 'Recipe Ingredient Item', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'A single ingredient associated with a recipe.', 'jetpack' ) }</p>
			<ExternalLink href="#">
				{ __( 'Learn more about Recipe Ingredient', 'jetpack' ) }
			</ExternalLink>
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
