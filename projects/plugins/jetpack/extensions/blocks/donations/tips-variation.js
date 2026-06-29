import { __ } from '@wordpress/i18n';
import { coffee } from './icons';

export const TIPS_VARIATION_NAME = 'tips';

export const tipsVariationAttributes = {
	variationName: TIPS_VARIATION_NAME,
	displayMode: 'modal',
	triggerSticky: false,
	triggerButtonText: 'Buy me a coffee',
	triggerIcon: 'coffee',
	contentAlignment: 'center',
	buttonAlignment: 'full',
	tabsAppearance: 'buttons',
	showCustomAmount: false,
	chooseAmountText: '',
	annualDonation: {
		show: false,
		planId: null,
		amounts: [ 3, 5, 8 ],
	},
	oneTimeDonation: {
		show: true,
		planId: null,
		amounts: [ 3, 5, 8 ],
		defaultAmountIndex: 0,
		heading: '',
		buttonText: 'Buy coffee',
		extraText: 'Thanks for your generosity!',
	},
	monthlyDonation: {
		show: true,
		planId: null,
		amounts: [ 3, 5, 8 ],
		defaultAmountIndex: 0,
		heading: '',
		buttonText: 'Buy coffee',
		extraText: 'Thanks for your generosity!',
	},
};

const tipsVariation = {
	name: TIPS_VARIATION_NAME,
	title: __( 'Tips', 'jetpack' ),
	description: __( 'Get financial support from friends and followers.', 'jetpack' ),
	icon: coffee,
	isDefault: false,
	attributes: tipsVariationAttributes,
	scope: [ 'inserter' ],
	isActive: attrs => attrs.variationName === TIPS_VARIATION_NAME,
	keywords: [
		__( 'tips', 'jetpack' ),
		__( 'coffee', 'jetpack' ),
		__( 'support', 'jetpack' ),
		__( 'buy me a coffee', 'jetpack' ),
	],
};

export default tipsVariation;
