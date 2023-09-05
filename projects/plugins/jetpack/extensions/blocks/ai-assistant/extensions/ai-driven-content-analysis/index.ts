/**
 * External dependencies
 */
import { registerPlugin } from '@wordpress/plugins';
/**
 * Internal dependencies
 */
import { PluginDocumentSettingPanelAiExcerpt } from './panels';

registerPlugin( 'jetpack-ai-post-excerpt-panel', {
	render: PluginDocumentSettingPanelAiExcerpt,
	icon: 'palmtree',
} );
