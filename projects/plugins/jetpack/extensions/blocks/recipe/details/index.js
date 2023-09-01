import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getClientBlockIconProp } from '../../../shared/get-block-icon-from-metadata';
import metadata from '../block.json';
import attributes from './attributes';
import edit from './edit';
import save from './save';

import './editor.scss';

export const name = 'recipe-details';

export const settings = {
	title: __( 'Recipe Details', 'jetpack' ),
	description: (
		<Fragment>
			<p>{ __( 'Recipe Details', 'jetpack' ) }</p>
		</Fragment>
	),
	keywords: [],
	supports: {
		align: [ 'left', 'right', 'center' ],
	},
	icon: getClientBlockIconProp( metadata ),
	category: 'widgets',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
