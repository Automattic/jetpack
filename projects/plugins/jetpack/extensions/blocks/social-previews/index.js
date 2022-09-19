import { JetpackLogo } from '@automattic/jetpack-components';
import { SocialPreviewsModal, SocialPreviewsPanel } from '@automattic/jetpack-publicize-components';
import { PanelBody } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import './editor.scss';

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
				<PanelBody title={ __( 'Social Previews', 'jetpack' ) }>
					<SocialPreviewsPanel openModal={ () => setIsOpened( true ) } />
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel
				title={ __( 'Social Previews', 'jetpack' ) }
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
			>
				<SocialPreviewsPanel openModal={ () => setIsOpened( true ) } />
			</PluginPrePublishPanel>
		</>
	);
};
