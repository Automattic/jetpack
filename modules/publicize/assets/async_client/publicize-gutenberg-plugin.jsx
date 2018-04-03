/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenbergs PluginPostPublishPanel
 * to display Jetpack's Publicize UI in the post
 * publish flow.
 *
 * @since  5.9.1
 */

/**
 * Internal dependencies
 */
import PublicizeSidebarPanel from './publicize-sidebar-panel';
const { __ } = wp.i18n;
const { PluginPostPublishPanel } = wp.editPost.__experimental;
const { registerPlugin } = wp.plugins;

const PluginRender = () => (
	<PluginPostPublishPanel>
		<PublicizeSidebarPanel/>
	</PluginPostPublishPanel>
);

registerPlugin( 'jetpack-publicize', {
	render: PluginRender
} );
