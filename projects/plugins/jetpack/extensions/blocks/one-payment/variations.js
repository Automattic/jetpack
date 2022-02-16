/**
 * The different payment blocks that can be chosen.
 *
 * Important note: This block must be loaded after the different blocks that can be chosen. This can be done by ensuring
 * this is at the bottom of the block list at `projects/plugins/jetpack/extensions/index.json`.
 */

/**
 * External dependancies
 */

import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { settings as donationSettings } from '../donations';
import { settings as recurringPaymentSettings } from '../recurring-payments';

const variations = [
	[ 'donations', donationSettings ],
	[ 'recurring-payments', recurringPaymentSettings ],
];

const variationDefinitions = variations
	.map( blockNameSettings => {
		const blockDefinition = {};
		const [ blockName, settings ] = blockNameSettings;
		if ( getBlockType( 'jetpack/' + blockName ) ) {
			blockDefinition.name = 'jetpack/onepayment-' + blockName;
			blockDefinition.title = settings.title;
			blockDefinition.description = settings.description;
			blockDefinition.icon = settings.icon.src;
			blockDefinition.innerBlocks = [ [ 'jetpack/' + blockName, {} ] ];
			// The inner block itself is already listed in the inserter in its own right, so just include in this blocks
			// unified intro.
			blockDefinition.scope = [ 'block' ];
		}

		return blockDefinition;
	} )
	.filter( blockDefinition => Object.entries( blockDefinition ).length > 0 );

export default variationDefinitions;
