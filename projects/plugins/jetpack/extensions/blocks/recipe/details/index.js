import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import { DetailIcon } from '../icon';
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
	icon: {
		src: DetailIcon,
		foreground: getIconColor(),
	},
	category: 'embed',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
