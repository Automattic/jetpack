/**
 * External dependencies
 */
import { registerPlugin } from '@wordpress/plugins';
/**
 * Internal dependencies
 */
import { isPossibleToExtendBlock } from '../ai-assistant';
import { PluginDocumentSettingPanelAiExcerpt } from './plugins/ai-post-excerpt';

export const AI_CONTENT_LENS = 'ai-content-lens' as const;

const isAiAssistantSupportExtensionEnabled =
	window?.Jetpack_Editor_Initial_State.available_blocks[ 'ai-content-lens' ];

// AI Content Lens features
if ( isPossibleToExtendBlock() && isAiAssistantSupportExtensionEnabled.available ) {
	registerPlugin( 'jetpack-ai-post-excerpt-panel', {
		render: PluginDocumentSettingPanelAiExcerpt,
	} );
}
