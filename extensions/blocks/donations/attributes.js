/**
 * WordPress dependencies
 */
// eslint-disable-next-line wpcalypso/import-docblock
import { __ } from '@wordpress/i18n';

export default {
	currency: {
		type: 'string',
		default: 'USD',
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
		default: __( 'Make a one-time donation', 'full-site-editing' ),
	},
	monthlyHeading: {
		type: 'string',
		default: __( 'Make a monthly donation', 'full-site-editing' ),
	},
	annualHeading: {
		type: 'string',
		default: __( 'Make a yearly donation', 'full-site-editing' ),
	},
	chooseAmountText: {
		type: 'string',
		default: __( 'Choose an amount (USD)', 'full-site-editing' ),
	},
	customAmountText: {
		type: 'string',
		default: __( 'Or enter a custom amount', 'full-site-editing' ),
	},
	extraText: {
		type: 'string',
		default: __( 'Your contribution is appreciated.', 'full-site-editing' ),
	},
	oneTimeButtonText: {
		type: 'string',
		default: __( 'Donate', 'full-site-editing' ),
	},
	monthlyButtonText: {
		type: 'string',
		default: __( 'Donate monthly', 'full-site-editing' ),
	},
	annualButtonText: {
		type: 'string',
		default: __( 'Donate yearly', 'full-site-editing' ),
	},
};
