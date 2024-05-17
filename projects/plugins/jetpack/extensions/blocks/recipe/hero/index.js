import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import edit from './edit';
import save from './save';

export const name = 'recipe-hero';
export const title = __( 'Recipe Hero', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'Image area for the recipe.', 'jetpack' ) }</p>
		</Fragment>
	),
	keywords: [],
	icon: getBlockIconProp( metadata ),
	category: 'widgets',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
