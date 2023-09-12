/**
 * External dependencies
 */
import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { isPossibleToExtendBlock } from '../../blocks/ai-assistant/extensions/ai-assistant';
import { name as pluginName, settings as pluginSettings } from '.';

export const AI_CONTENT_LENS = 'ai-content-lens';

const isAiAssistantSupportExtensionEnabled =
	window?.Jetpack_Editor_Initial_State.available_blocks[ 'ai-content-lens' ];

/**
 * Extend the editor with AI Content Lens features,
 * as long as the AI Assistant blocks is registered.
 *
 * @param {object} settings - Block settings.
 * @param {string} name     - Block name.
 * @returns {object}          Block settings.
 */
function extendAiContentLensFeatures( settings, name ) {
	if ( name !== 'jetpack/ai-assistant' ) {
		return settings;
	}

	if ( ! isPossibleToExtendBlock() ) {
		return settings;
	}

	registerJetpackPlugin( pluginName, pluginSettings );

	return settings;
}

// Filter only if the extension is enabled.
if ( isAiAssistantSupportExtensionEnabled?.available ) {
	addFilter(
		'blocks.registerBlockType',
		'jetpack/ai-content-lens-features',
		extendAiContentLensFeatures
	);
}
