import { SocialPreviewsModal, SocialPreviewsPanel } from '@automattic/jetpack-publicize-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';

export const name = 'social-previews';

export const settings = {
	render: () => <SocialPreviews />,
};

export const SocialPreviews = function SocialPreviews() {
	const [ isOpened, setIsOpened ] = useState( false );

	return (
		<>
			{ isOpened && <SocialPreviewsModal onClose={ () => setIsOpened( false ) } /> }
			<JetpackPluginSidebar>
				<PanelBody title={ __( 'Social Previews', 'jetpack' ) } initialOpen={ false }>
					<SocialPreviewsPanel openModal={ () => setIsOpened( true ) } />
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel
				title={ __( 'Social Previews', 'jetpack' ) }
				icon={ <JetpackEditorPanelLogo /> }
				initialOpen={ false }
			>
				<SocialPreviewsPanel openModal={ () => setIsOpened( true ) } />
			</PluginPrePublishPanel>
		</>
	);
};
