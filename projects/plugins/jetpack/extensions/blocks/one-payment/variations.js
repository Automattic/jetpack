/**
 * The different payment blocks that can be chosen.
 */

/**
 * Internal dependencies
 */
import { settings as DonationSettings } from '../donations';
import { settings as RecurringPaymentSettings } from '../recurring-payments';

const variations = [
	{
		name: 'onepayment-donations',
		title: DonationSettings.title,
		description: DonationSettings.description,
		innerBlocks: [ [ 'jetpack/donations', {} ] ],
		// The inner block itself is already listed in the inserter in its own right, so just include in this blocks
		// unified intro.
		scope: [ 'block' ],
	},
	{
		name: 'onepayment-recurring-payments',
		title: RecurringPaymentSettings.title,
		description: RecurringPaymentSettings.description,
		innerBlocks: [ [ 'jetpack/recurring-payments', {} ] ],
		// The inner block itself is already listed in the inserter in its own right, so just include in this blocks
		// unified intro.
		scope: [ 'block' ],
	},
];

export default variations;
