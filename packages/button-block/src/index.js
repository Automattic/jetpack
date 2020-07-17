/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
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
		align: [ 'left', 'right' ],
	},
	styles: [
		{ name: 'fill', label: __( 'Fill', 'jetpack' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline', 'jetpack' ) },
	],
	attributes,
	edit,
	save,
};
