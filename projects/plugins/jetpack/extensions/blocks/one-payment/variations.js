/**
 * The different payment blocks that can be chosen.
 */

/**
 * External dependancies
 */

import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { settings as DonationSettings } from '../donations';
import { settings as RecurringPaymentSettings } from '../recurring-payments';

const variations = [];

if ( getBlockType( 'jetpack/donations' ) ) {
	variations.push( {
		name: 'onepayment-donations',
		title: DonationSettings.title,
		description: DonationSettings.description,
		icon: DonationSettings.icon.src,
		innerBlocks: [ [ 'jetpack/donations', {} ] ],
		// The inner block itself is already listed in the inserter in its own right, so just include in this blocks
		// unified intro.
		scope: [ 'block' ],
	} );
}

if ( getBlockType( 'jetpack/recurring-payments' ) ) {
	variations.push( {
		name: 'onepayment-recurring-payments',
		title: RecurringPaymentSettings.title,
		description: RecurringPaymentSettings.description,
		icon: RecurringPaymentSettings.icon.src,
		innerBlocks: [ [ 'jetpack/recurring-payments', {} ] ],
		// The inner block itself is already listed in the inserter in its own right, so just include in this blocks
		// unified intro.
		scope: [ 'block' ],
	} );
}

export default variations;
