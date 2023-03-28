import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import icon from '../icon';
import edit from './edit';
import save from './save';

export const name = 'recipe-step';
export const title = __( 'Recipe Step', 'jetpack' );
export const settings = {
	title,
	description: __( 'A single recipe step.', 'jetpack' ),
	keywords: [],
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'widgets',
	edit,
	save,
	parent: [ 'jetpack/recipe' ],
};
