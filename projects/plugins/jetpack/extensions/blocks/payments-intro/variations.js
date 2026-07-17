/**
 * The different payment blocks that can be chosen.
 */

import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import donationMetadata from '../donations/block.json';
import tipsVariation from '../donations/tips-variation';
import paymentButtonsMetadata from '../payment-buttons/block.json';
import premiumContentMetadata from '../premium-content/block.json';

const standardBlocks = [
	[ donationMetadata.name, donationMetadata ],
	[ paymentButtonsMetadata.name, paymentButtonsMetadata ],
	[ premiumContentMetadata.name, premiumContentMetadata ],
];

const standardDefs = standardBlocks.map( ( [ blockName, settings ] ) => {
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

const tipsDef = {
	name: 'jetpack/donations',
	displayTitle: tipsVariation.title,
	description: tipsVariation.description,
	icon: tipsVariation.icon,
	attributes: tipsVariation.attributes,
};

export default [ ...standardDefs, tipsDef ];
