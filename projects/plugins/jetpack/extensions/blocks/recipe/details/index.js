import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import attributes from './attributes';
import edit from './edit';
import save from './save';

import './editor.scss';

export const name = 'recipe-details';

export const settings = {
	apiVersion: 3,
	title: __( 'Recipe Details', 'jetpack' ),
	description: __( 'Recipe Details', 'jetpack' ),
	keywords: [],
	supports: {
		align: [ 'left', 'right', 'center' ],
	},
	icon: getBlockIconProp( metadata ),
	category: 'widgets',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
