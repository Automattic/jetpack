/**
 * The different payment blocks that can be chosen.
 */

import { name as donationsName, settings as donationSettings } from '../donations';
import { name as premiumContentName, settings as premiumContentSettings } from '../premium-content';
import {
	name as recurringPaymentsName,
	settings as recurringPaymentSettings,
} from '../recurring-payments';

const variations = [
	[ donationsName, donationSettings ],
	[ recurringPaymentsName, recurringPaymentSettings ],
	[ premiumContentName, premiumContentSettings ],
];

const variationDefinitions = variations.map( ( [ blockName, settings ] ) => {
	return {
		name: blockName.includes( '/' ) ? blockName : 'jetpack/' + blockName,
		title: settings.title,
		description: settings.description,
		icon: settings.icon.src ?? settings.icon,
	};
} );

export default variationDefinitions;
