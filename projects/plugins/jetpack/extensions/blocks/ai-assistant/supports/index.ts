/**
 * External dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

export const SUPPORT_NAME = 'jetpack/ai';

function handleJetpackAISupports( settings ) {
	if ( ! getBlockSupport( settings, SUPPORT_NAME ) ) {
		return settings;
	}

	return {
		...settings,
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/handle-jetpack-ai-supports',
	handleJetpackAISupports
);
