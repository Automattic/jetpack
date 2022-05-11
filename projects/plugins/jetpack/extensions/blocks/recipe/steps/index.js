/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import icon from './icon';
import { getIconColor } from '../../../shared/block-icons';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'recipe-steps';
export const title = __( 'Recipe Steps', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'Step by step instructions for the recipe.', 'jetpack' ) }</p>
			<ExternalLink href="#">{ __( 'Learn more about Recipe Steps', 'jetpack' ) }</ExternalLink>
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
