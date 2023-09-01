import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getClientBlockIconProp } from '../../../shared/get-block-icon-from-metadata';
import metadata from '../block.json';
import edit from './edit';
import save from './save';

export const name = 'recipe-step';
export const title = __( 'Recipe Step', 'jetpack' );
export const settings = {
	title,
	description: (
		<Fragment>
			<p>{ __( 'A single recipe step.', 'jetpack' ) }</p>
		</Fragment>
	),
	keywords: [],
	icon: getClientBlockIconProp( metadata ),
	category: 'widgets',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
