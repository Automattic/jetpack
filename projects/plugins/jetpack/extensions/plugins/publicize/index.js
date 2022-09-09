/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenberg's PluginPrePublishPanel
 * to display Jetpack's Publicize UI in the pre-publish flow.
 *
 * It also hooks into our dedicated Jetpack plugin sidebar and
 * displays the Publicize UI there.
 */

import { JetpackLogo } from '@automattic/jetpack-components';
import { TwitterThreadListener } from '@automattic/jetpack-publicize-components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import PublicizePanel from './components/panel';

import './editor.scss';

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
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#444444" /> }
			>
				<PublicizePanel prePublish={ true } />
			</PluginPrePublishPanel>
		</PostTypeSupportCheck>
	),
};
