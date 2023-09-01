import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getClientBlockIconProp } from '../../../shared/get-block-icon-from-metadata';
import metadata from '../block.json';
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
	icon: getClientBlockIconProp( metadata ),
	category: 'widgets',
	keywords: [],
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
