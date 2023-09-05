/**
 * External dependencies
 */
import { registerPlugin } from '@wordpress/plugins';
/**
 * Internal dependencies
 */
import { PluginDocumentSettingPanelAiExcerpt } from './plugins/ai-post-excerpt';

// AI-driven Post Excerpt
registerPlugin( 'jetpack-ai-post-excerpt-panel', {
	render: PluginDocumentSettingPanelAiExcerpt,
} );
