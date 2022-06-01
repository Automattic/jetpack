import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import icon from '../icon';
import attributes from './attributes';
import edit from './edit';
import save from './save';

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
