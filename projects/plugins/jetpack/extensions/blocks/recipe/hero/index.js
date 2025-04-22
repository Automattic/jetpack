import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import edit from './edit';
import save from './save';

export const name = 'recipe-hero';
export const title = __( 'Recipe Hero', 'jetpack' );
export const settings = {
	apiVersion: 3,
	title,
	description: __( 'Image area for the recipe.', 'jetpack' ),
	keywords: [],
	icon: getBlockIconProp( metadata ),
	category: 'widgets',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
