import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getClientBlockIconProp } from '../../../shared/get-block-icon-from-metadata';
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
	icon: getClientBlockIconProp( metadata ),
	category: 'widgets',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
