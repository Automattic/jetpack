import { InnerBlocks } from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';
import { currencyDollar } from '@wordpress/icons';
import { getIconColor } from '../../shared/block-icons';
import { settings as donationSettings } from '../donations';
import { settings as premiumContentSettings } from '../premium-content';
import { settings as recurringPaymentSettings } from '../recurring-payments';
import edit from './edit';

export const name = 'payments-intro';
export const title = __( 'Payments', 'jetpack' );
export const settings = {
	title,
	description: __( 'Sell products and services or receive donations on your website', 'jetpack' ),
	icon: {
		src: currencyDollar,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [
		...new Set( [
			donationSettings.title,
			...donationSettings.keywords,
			recurringPaymentSettings.title,
			...recurringPaymentSettings.keywords,
			premiumContentSettings.title,
			...premiumContentSettings.keywords,
			_x( 'paid', 'block search term', 'jetpack' ),
			_x( 'pay', 'block search term', 'jetpack' ),
			_x( 'money', 'block search term', 'jetpack' ),
			_x( 'checkout', 'block search term', 'jetpack' ),
		] ),
	],
	supports: {
		// This block acts as a temporary placeholder before inserting a different block and so should not offer any
		// customisation or mark-up specific to this block. Such things are up to the individual blocks inserted instead.
		alignWide: false,
		className: true,
		customClassName: false,
		html: false,
		reusable: false,
	},
	edit,
	save: () => <InnerBlocks.Content />,
};
