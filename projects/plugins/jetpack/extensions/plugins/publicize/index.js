/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenberg's PluginPrePublishPanel
 * to display Jetpack's Publicize UI in the pre-publish flow.
 *
 * It also hooks into our dedicated Jetpack plugin sidebar and
 * displays the Publicize UI there.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';
import './store';
import TwitterThreadListener from './components/twitter';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import PublicizePanel from './components/panel';

export const name = 'publicize';

export const settings = {
	render: () => (
		<PostTypeSupportCheck supportKeys="publicize">
			<TwitterThreadListener />

			<JetpackPluginSidebar>
				<PublicizePanel />
			</JetpackPluginSidebar>

			<PluginPrePublishPanel
				initialOpen
				id="publicize-title"
				title={
					<span id="publicize-defaults" key="publicize-title-span">
						{ __( 'Share this post', 'jetpack' ) }
					</span>
				}
			>
				<PublicizePanel prePublish={ true } />
			</PluginPrePublishPanel>
		</PostTypeSupportCheck>
	),
};
