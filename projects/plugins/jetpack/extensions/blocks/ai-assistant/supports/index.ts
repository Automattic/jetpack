/**
 * External dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import withAIAssistant from '../extensions/ai-assistant/with-ai-assistant';

export const SUPPORT_NAME = 'jetpack/ai';

function handleJetpackAISupports( settings ) {
	const jetpackAISupports = getBlockSupport( settings, SUPPORT_NAME );
	if ( ! jetpackAISupports ) {
		return settings;
	}

	// Check specific for the `assistant` support.
	if ( ! jetpackAISupports?.assistant ) {
		return settings;
	}

	return {
		...settings,
		edit: withAIAssistant( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/handle-jetpack-ai-supports',
	handleJetpackAISupports,
	100
);
