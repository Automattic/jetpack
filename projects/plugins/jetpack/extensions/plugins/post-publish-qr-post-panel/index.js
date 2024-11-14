import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar.js';
import { QRPostButton } from './components/qr-post.js';
import './editor.scss';

export const name = 'post-publish-qr-post-panel';

export const settings = {
	render: function PluginPostPublishPanelQRPost() {
		const panelBodyProps = {
			name: 'post-publish-qr-post-panel',
			title: __( 'QR Code', 'jetpack' ),
			className: 'post-publish-qr-post-panel',
			initialOpen: false,
		};

		const { isViewable, isPostPublished } = useSelect( select => {
			const postTypeName = select( editorStore ).getCurrentPostType();
			const postTypeObject = select( coreStore ).getPostType( postTypeName );

			return {
				isViewable: postTypeObject?.viewable,
				isPostPublished: select( editorStore ).isCurrentPostPublished(),
			};
		}, [] );

		// If the post type is not viewable, do not render my plugin.
		if ( ! isViewable ) {
			return null;
		}

		function QRPostPanelBodyContent() {
			return (
				<>
					<PanelRow>
						<p>
							{ __(
								'Take advantage of the QR code to open the post from different devices.',
								'jetpack'
							) }
						</p>
					</PanelRow>
					<QRPostButton />
				</>
			);
		}

		return (
			<>
				<PluginPostPublishPanel { ...panelBodyProps } icon={ <JetpackEditorPanelLogo /> }>
					<QRPostPanelBodyContent />
				</PluginPostPublishPanel>

				{ isPostPublished && (
					<JetpackPluginSidebar>
						<PanelBody { ...panelBodyProps }>
							<QRPostPanelBodyContent />
						</PanelBody>
					</JetpackPluginSidebar>
				) }
			</>
		);
	},
};
