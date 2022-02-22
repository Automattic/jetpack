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
		baseAmountMultiplier: {
			type: 'integer',
		},
		label: {
			type: 'string',
		},
		currency: {
			type: 'string',
		},
		amount: {
			type: 'number',
		},
		disabled: {
			type: 'boolean',
			default: false,
		},
	},
	__experimentalLabel: ( { disabled } ) => {
		if ( disabled ) {
			// The amount field behaves as a custom amount field.
			return __( 'Custom amount field', 'jetpack' );
		}
		return __( 'Amount selector', 'jetpack' );
	},
	icon,
	supports: {
		align: true,
		alignWide: true,
		html: false,
		inserter: false,
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
