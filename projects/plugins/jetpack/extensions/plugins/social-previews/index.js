import { SocialPreviewsModal, SocialPreviewsPanel } from '@automattic/jetpack-publicize-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';

export const name = 'social-previews';

export const settings = {
	render: () => <SocialPreviews />,
};

export const SocialPreviews = function SocialPreviews() {
	const [ isOpened, setIsOpened ] = useState( false );

	const isViewable = useSelect( select => {
		const postTypeName = select( editorStore ).getCurrentPostType();
		const postTypeObject = select( coreStore ).getPostType( postTypeName );

		return postTypeObject?.viewable;
	}, [] );
	// If the post type is not viewable, do not render my plugin.
	if ( ! isViewable ) {
		return null;
	}

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
