/**
 * The different payment blocks that can be chosen.
 */

/**
 * Internal dependencies
 */
import { name as premiumContentName, settings as premiumContentSettings } from '../premium-content';
import { name as donationsName, settings as donationSettings } from '../donations';
import {
	name as recurringPaymentsName,
	settings as recurringPaymentSettings,
} from '../recurring-payments';

const variations = [
	[ donationsName, donationSettings ],
	[ recurringPaymentsName, recurringPaymentSettings ],
	[ premiumContentName, premiumContentSettings ],
];

const variationDefinitions = variations.map( blockNameSettings => {
	let blockName = blockNameSettings[ 0 ];
	const settings = blockNameSettings[ 1 ];

	if ( ! blockName.includes( '/' ) ) {
		blockName = 'jetpack/' + blockName;
	}

	return {
		name: blockName,
		title: settings.title,
		description: settings.description,
		icon: settings.icon.src ?? settings.icon,
	};
} );

export default variationDefinitions;
