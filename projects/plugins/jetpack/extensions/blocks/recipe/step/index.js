import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import edit from './edit';
import save from './save';

export const name = 'recipe-step';
export const title = __( 'Recipe Step', 'jetpack' );
export const settings = {
	apiVersion: 3,
	title,
	description: __( 'A single recipe step.', 'jetpack' ),
	keywords: [],
	icon: getBlockIconProp( metadata ),
	category: 'widgets',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
