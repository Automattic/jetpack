/**
 * External dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { isPossibleToExtendBlock } from '../extensions/ai-assistant';
import withAIAssistant from '../extensions/ai-assistant/with-ai-assistant';
import { withAiAssistantToolbarButton } from '../extensions/ai-assistant/with-ai-assistant-support';

export const SUPPORT_NAME = 'jetpack/ai';

function handleJetpackAIBlockTypeSupport( settings ) {
	const jetpackAISupports = getBlockSupport( settings, SUPPORT_NAME );
	if ( ! jetpackAISupports ) {
		return settings;
	}

	// Check specific for the `assistant` support.
	if ( ! jetpackAISupports?.assistant ) {
		return settings;
	}

	if ( ! isPossibleToExtendBlock() ) {
		return settings;
	}

	return {
		...settings,
		edit: withAIAssistant( withAiAssistantToolbarButton( settings.edit ) ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/handle-jetpack-ai-supports',
	handleJetpackAIBlockTypeSupport,
	100
);
