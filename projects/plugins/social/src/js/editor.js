import { SocialIcon } from '@automattic/jetpack-components';
import { SocialPreviewsModal, SocialPreviewsPanel } from '@automattic/jetpack-publicize-components';
import { PanelBody } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	PluginPrePublishPanel,
} from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { getQueryArg } from '@wordpress/url';
import PublicizePanel from './components/publicize-panel';

import './editor.scss';

/**
 * Open Jetpack Social sidebar by default when URL includes jetpackSidebarIsOpen=true.
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
	render: () => <JetpackSocialSidebar />,
} );

const JetpackSocialSidebar = () => {
	const [ isModalOpened, setIsModalOpened ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			{ isModalOpened && <SocialPreviewsModal onClose={ closeModal } /> }

			<PluginSidebarMoreMenuItem target="jetpack-social" icon={ <SocialIcon /> }>
				Jetpack Social
			</PluginSidebarMoreMenuItem>

			<PluginSidebar name="jetpack-social" title="Jetpack Social" icon={ <SocialIcon /> }>
				<PublicizePanel />
				<PanelBody title={ __( 'Social Previews', 'jetpack-social' ) }>
					<SocialPreviewsPanel openModal={ openModal } />
				</PanelBody>
			</PluginSidebar>

			<PluginPrePublishPanel initialOpen title={ __( 'Share this post', 'jetpack-social' ) }>
				<PublicizePanel prePublish={ true } />
			</PluginPrePublishPanel>

			<PluginPrePublishPanel initialOpen title={ __( 'Social Previews', 'jetpack-social' ) }>
				<SocialPreviewsPanel openModal={ openModal } />
			</PluginPrePublishPanel>
		</PostTypeSupportCheck>
	);
};
