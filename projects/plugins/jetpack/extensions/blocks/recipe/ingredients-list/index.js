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

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'recipe-ingredients-list';
export const title = __( 'Recipe Ingredients List', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'Recipe ingredient list', 'jetpack' ) }</p>
		</Fragment>
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'jetpack',
	keywords: [],
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
