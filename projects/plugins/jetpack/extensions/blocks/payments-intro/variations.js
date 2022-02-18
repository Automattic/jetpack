/**
 * The different payment blocks that can be chosen.
 *
 * Important note: This block must be loaded after the different blocks that can be chosen. This can be done by ensuring
 * this is at the bottom of the block list at `projects/plugins/jetpack/extensions/index.json`.
 */

/**
 * External dependencies
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
		const [ blockName, settings ] = blockNameSettings;
		if ( ! getBlockType( 'jetpack/' + blockName ) ) {
			return {};
		}
		return {
			name: 'payments-intro/' + blockName,
			title: settings.title,
			description: settings.description,
			icon: settings.icon.src,
		};
	} )
	.filter( blockDefinition => Object.entries( blockDefinition ).length > 0 );

export default variationDefinitions;
