/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default {
	currency: {
		type: 'string',
		default: 'USD',
	},
	oneTimeDonation: {
		type: 'object',
		default: {
			show: true,
			planId: null,
			amounts: [ 5, 15, 100 ],
			heading: __( 'Make a one-time donation', 'jetpack' ),
			extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
			buttonText: __( 'Donate', 'jetpack' ),
		},
	},
	monthlyDonation: {
		type: 'object',
		default: {
			show: true,
			planId: null,
			amounts: [ 5, 15, 100 ],
			heading: __( 'Make a monthly donation', 'jetpack' ),
			extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
			buttonText: __( 'Donate monthly', 'jetpack' ),
		},
	},
	annualDonation: {
		type: 'object',
		default: {
			show: true,
			planId: null,
			amounts: [ 5, 15, 100 ],
			heading: __( 'Make a yearly donation', 'jetpack' ),
			extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
			buttonText: __( 'Donate yearly', 'jetpack' ),
		},
	},
	showCustomAmount: {
		type: 'boolean',
		default: true,
	},
	chooseAmountText: {
		type: 'string',
		default: __( 'Choose an amount', 'jetpack' ),
	},
	customAmountText: {
		type: 'string',
		default: __( 'Or enter a custom amount', 'jetpack' ),
	},
	styles: {
		type: 'object',
		default: {
			backgroundColor: null,
			textColor: null,
			gradient: null,
			tab: {
				backgroundColor: null,
				textColor: null,
				gradient: null,
			},
			amount: {
				backgroundColor: null,
				textColor: null,
				gradient: null,
			},
			button: {
				backgroundColor: null,
				textColor: null,
				gradient: null,
			},
		},
	},
};
