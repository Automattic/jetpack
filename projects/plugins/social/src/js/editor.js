/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	PluginPrePublishPanel,
} from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';
import { dispatch } from '@wordpress/data';
import { getQueryArg } from '@wordpress/url';
import domReady from '@wordpress/dom-ready';
import { JetpackLogo } from '@automattic/jetpack-components';

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

const PublicizePanel = () => <span>This is a placeholder panel</span>;

registerPlugin( 'jetpack-social', {
	render: () => (
		<PostTypeSupportCheck supportKeys="publicize">
			<PluginSidebarMoreMenuItem
				target="jetpack-social"
				icon={ <JetpackLogo showText={ false } /> }
			>
				Jetpack Social
			</PluginSidebarMoreMenuItem>

			<PluginSidebar
				name="jetpack-social"
				title="Jetpack Social"
				icon={ <JetpackLogo showText={ false } /> }
			>
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
