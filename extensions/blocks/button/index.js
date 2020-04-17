/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';

export const name = 'button';

export const settings = {
	title: __( 'Button', 'jetpack' ),
	icon,
	category: 'layout',
	keywords: [],
	supports: {
		html: false,
		inserter: false,
	},
	attributes,
	edit,
	save,
};
