import { SocialIcon } from '@automattic/jetpack-components';
import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	PluginPrePublishPanel,
} from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { getQueryArg } from '@wordpress/url';
import PublicizePanel from './components/panel';

import './editor.scss';

/**
 * Open Jetpack Spcoal; sidebar by default when URL includes jetpackSidebarIsOpen=true.
 */
domReady( () => {
	if ( getQueryArg( window.location.search, 'jetpackSidebarIsOpen' ) === 'true' ) {
		dispatch( 'core/interface' ).enableComplementaryArea(
			'core/edit-post',
			'jetpack-social-sidebar/jetpack-social'
		);
	}
} );

registerPlugin( 'jetpack-social', {
	render: () => (
		<PostTypeSupportCheck supportKeys="publicize">
			<PluginSidebarMoreMenuItem target="jetpack-social" icon={ <SocialIcon /> }>
				Jetpack Social
			</PluginSidebarMoreMenuItem>

			<PluginSidebar name="jetpack-social" title="Jetpack Social" icon={ <SocialIcon /> }>
				<PublicizePanel />
			</PluginSidebar>

			<PluginPrePublishPanel
				initialOpen
				id="publicize-title"
				title={
					<span id="publicize-defaults" key="publicize-title-span">
						{ __( 'Share this post', 'jetpack-social' ) }
					</span>
				}
			>
				<PublicizePanel prePublish={ true } />
			</PluginPrePublishPanel>
		</PostTypeSupportCheck>
	),
} );
