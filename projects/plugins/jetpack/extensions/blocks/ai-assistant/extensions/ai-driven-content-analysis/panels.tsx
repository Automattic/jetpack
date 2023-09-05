/**
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';

export const PluginDocumentSettingPanelAiExcerpt = () => (
	<PluginDocumentSettingPanel
		name="ai-driven-excerpt"
		title={ __( 'AI Excerpt', 'jetpack' ) }
		icon={ aiAssistantIcon }
	>
		Post Excerpt assisted by AI
	</PluginDocumentSettingPanel>
);
