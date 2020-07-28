/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default {
	currency: {
		type: 'string',
		default: 'USD',
	},
	amounts: {
		type: 'array',
		items: {
			type: 'number',
		},
		default: [ 5, 15, 100 ],
	},
	oneTimePlanId: {
		type: 'number',
		default: null,
	},
	monthlyPlanId: {
		type: 'number',
		default: null,
	},
	annuallyPlanId: {
		type: 'number',
		default: null,
	},
	showCustomAmount: {
		type: 'boolean',
		default: true,
	},
	oneTimeHeading: {
		type: 'string',
		default: __( 'Make a one-time donation', 'jetpack' ),
	},
	monthlyHeading: {
		type: 'string',
		default: __( 'Make a monthly donation', 'jetpack' ),
	},
	annualHeading: {
		type: 'string',
		default: __( 'Make a yearly donation', 'jetpack' ),
	},
	chooseAmountText: {
		type: 'string',
		default: __( 'Choose an amount', 'jetpack' ),
	},
	customAmountText: {
		type: 'string',
		default: __( 'Or enter a custom amount', 'jetpack' ),
	},
	extraText: {
		type: 'string',
		default: __( 'Your contribution is appreciated.', 'jetpack' ),
	},
	oneTimeButtonText: {
		type: 'string',
		default: __( 'Donate', 'jetpack' ),
	},
	monthlyButtonText: {
		type: 'string',
		default: __( 'Donate monthly', 'jetpack' ),
	},
	annualButtonText: {
		type: 'string',
		default: __( 'Donate yearly', 'jetpack' ),
	},
};
