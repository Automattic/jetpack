import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import attributes from './attributes';
import edit from './edit';
import save from './save';

import './editor.scss';

export const name = 'recipe-ingredients-list';
export const title = __( 'Recipe Ingredients List', 'jetpack' );
export const settings = {
	apiVersion: 3,
	title,
	description: __( 'Recipe ingredient list', 'jetpack' ),
	icon: getBlockIconProp( metadata ),
	category: 'widgets',
	keywords: [],
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
