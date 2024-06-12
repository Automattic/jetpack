import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, PanelRow } from '@wordpress/components';
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

		const { isPostPublished, postType } = useSelect( select => {
			return {
				isPostPublished: select( editorStore ).isCurrentPostPublished(),
				postType: select( editorStore ).getCurrentPostType(),
			};
		}, [] );

		// If postType is still not available, simply return and wait for the next call.
		if ( postType === null ) {
			return;
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
