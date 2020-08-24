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
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
	gradient: {
		type: 'string',
	},
	customGradient: {
		type: 'string',
	},
	tabBackgroundColor: {
		type: 'string',
	},
	tabCustomBackgroundColor: {
		type: 'string',
	},
	tabTextColor: {
		type: 'string',
	},
	tabCustomTextColor: {
		type: 'string',
	},
	tabGradient: {
		type: 'string',
	},
	tabCustomGradient: {
		type: 'string',
	},
	tabActiveBackgroundColor: {
		type: 'string',
	},
	tabActiveCustomBackgroundColor: {
		type: 'string',
	},
	tabActiveTextColor: {
		type: 'string',
	},
	tabActiveCustomTextColor: {
		type: 'string',
	},
	tabActiveGradient: {
		type: 'string',
	},
	tabActiveCustomGradient: {
		type: 'string',
	},
	amountsBackgroundColor: {
		type: 'string',
	},
	amountsCustomBackgroundColor: {
		type: 'string',
	},
	amountsTextColor: {
		type: 'string',
	},
	amountsCustomTextColor: {
		type: 'string',
	},
};
