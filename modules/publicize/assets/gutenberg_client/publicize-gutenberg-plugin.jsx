/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenberg's PluginPrePublishPanel
 * to display Jetpack's Publicize UI in the pre-
 * publish flow.
 *
 * @since  5.9.1
 */

/**
 * Internal dependencies
 */
const { __ } = wp.i18n;
const { PluginPrePublishPanel } = wp.editPost.__experimental;
const { registerPlugin } = wp.plugins;
import PublicizeForm from './publicize-form'

const PluginRender = () => (
	<PluginPrePublishPanel>
		<PublicizeForm />
	</PluginPrePublishPanel>
);

registerPlugin( 'jetpack-publicize', {
	render: PluginRender
} );
