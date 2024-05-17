/**
 * The different payment blocks that can be chosen.
 */

import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import donationMetadata from '../donations/block.json';
import paymentButtonsMetadata from '../payment-buttons/block.json';
import premiumContentMetadata from '../premium-content/block.json';

const variations = [
	[ donationMetadata.name, donationMetadata ],
	[ paymentButtonsMetadata.name, paymentButtonsMetadata ],
	[ premiumContentMetadata.name, premiumContentMetadata ],
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
