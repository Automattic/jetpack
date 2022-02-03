/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { group as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

const name = 'donations-custom-amount';

const settings = {
	title: __( 'Donations custom amount', 'jetpack' ),
	description: __( 'Enables the user to introduce a custom donation amount', 'jetpack' ),
	category: 'earn',
	attributes: {},
	icon,
	supports: {
		align: true,
		alignWide: true,
		html: false,
		lightBlockWrapper: true,
		inserter: false,
		reusable: false,
		color: {
			__experimentalSkipSerialization: true,
			gradients: true,
		},
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		spacing: {
			__experimentalSkipSerialization: true,
			padding: [ 'horizontal', 'vertical' ],
			__experimentalDefaultControls: {
				padding: true,
			},
		},
		__experimentalBorder: {
			radius: true,
			__experimentalSkipSerialization: true,
			__experimentalDefaultControls: {
				radius: true,
			},
		},
	},
	edit,
	save,
};

export { name, settings };
