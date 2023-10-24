/**
 * The different payment blocks that can be chosen.
 */

import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import donationMetadata from '../donations/block.json';
import { name as paymentButtonsName, settings as paymentButtonsSettings } from '../payment-buttons';
import { name as premiumContentName, settings as premiumContentSettings } from '../premium-content';

const variations = [
	[ donationMetadata.name, donationMetadata ],
	[ paymentButtonsName, paymentButtonsSettings ],
	[ premiumContentName, premiumContentSettings ],
];

const variationDefinitions = variations.map( ( [ blockName, settings ] ) => {
	const icon = settings.icon.src ?? settings.icon;

	return {
		name: blockName.includes( '/' ) ? blockName : 'jetpack/' + blockName,
		title: settings.title,
		description: settings.description,
		icon:
			typeof icon === 'string' && icon.toLowerCase().startsWith( '<svg' )
				? getBlockIconComponent( settings )
				: icon,
	};
} );

export default variationDefinitions;
