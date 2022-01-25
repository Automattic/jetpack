/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

const name = 'donations-amount';

const settings = {
	title: __( 'Donations amount button', 'jetpack' ),
	description: __( 'Button that determines a fixed donation amount', 'jetpack' ),
	category: 'earn',
	attributes: {
		value: {
			type: 'string',
		},
		borderRadius: {
			type: 'number',
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		gradient: {
			type: 'string',
		},
		style: {
			type: 'object',
		},
	},
	icon,
	supports: {
		align: true,
		alignWide: true,
		html: false,
		lightBlockWrapper: true,
		inserter: false,
	},
	styles: [
		{ name: 'fill', label: __( 'Fill', 'jetpack' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline', 'jetpack' ) },
	],
	edit,
	save,
};

export { name, settings };
