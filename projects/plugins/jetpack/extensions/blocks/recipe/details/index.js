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

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'recipe-details';

export const settings = {
	title: __( 'Recipe Details', 'jetpack' ),
	description: (
		<Fragment>
			<p>{ __( 'Recipe Details', 'jetpack' ) }</p>
			<ExternalLink href="#">{ __( 'Learn more about Recipe-details', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	keywords: [],
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'jetpack',
	usesContext: [ 'jetpack/recipe-prepTime', 'jetpack/recipe-cookTime', 'jetpack/recipe-servings' ],
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
