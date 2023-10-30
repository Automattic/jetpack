import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import attributes from './attributes';
import edit from './edit';
import save from './save';
import './editor.scss';

export const name = 'recipe-steps';
export const title = __( 'Recipe Steps', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'Step by step instructions for the recipe.', 'jetpack' ) }</p>
		</Fragment>
	),
	keywords: [],
	icon: getBlockIconProp( metadata ),
	category: 'widgets',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
