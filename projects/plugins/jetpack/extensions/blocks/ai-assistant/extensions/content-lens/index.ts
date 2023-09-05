/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
/**
 * Internal dependencies
 */
import { blockName as aiAssistantBlockName } from '../..';
import { isPossibleToExtendBlock } from '../ai-assistant';
import { PluginDocumentSettingPanelAiExcerpt } from './plugins/ai-post-excerpt';

export const AI_CONTENT_LENS = 'ai-content-lens' as const;

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
	if ( name !== aiAssistantBlockName ) {
		return settings;
	}

	if ( ! isPossibleToExtendBlock() ) {
		return settings;
	}

	registerPlugin( 'jetpack-ai-post-excerpt-panel', {
		render: PluginDocumentSettingPanelAiExcerpt,
	} );

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
