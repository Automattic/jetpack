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
const BUTTON_BEHAVIOUR_TITLE = __( 'Amount selector', 'jetpack' );
const INPUT_BEHAVIOUR_TITLE = __( 'Custom amount field', 'jetpack' );

const settings = {
	title: __( 'Donations amount button', 'jetpack' ),
	description: __( 'Button that determines a fixed donation amount', 'jetpack' ),
	category: 'earn',
	attributes: {
		baseAmountMultiplier: {
			type: 'string',
		},
		label: {
			type: 'string',
		},
		currency: {
			type: 'string',
		},
		amount: {
			type: 'string',
		},
		disabled: {
			type: 'boolean',
		},
	},
	__experimentalLabel: ( { disabled } ) =>
		disabled ? INPUT_BEHAVIOUR_TITLE : BUTTON_BEHAVIOUR_TITLE,
	icon,
	supports: {
		align: true,
		alignWide: true,
		html: false,
		lightBlockWrapper: true,
		color: {
			gradients: true,
		},
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		reusable: false,
		spacing: {
			padding: [ 'horizontal', 'vertical' ],
			__experimentalDefaultControls: {
				padding: true,
			},
		},
		__experimentalBorder: {
			radius: true,
			__experimentalDefaultControls: {
				radius: true,
			},
		},
	},
	styles: [
		{ name: 'fill', label: __( 'Fill', 'jetpack' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline', 'jetpack' ) },
	],
	edit,
	save,
};

export { name, settings };
