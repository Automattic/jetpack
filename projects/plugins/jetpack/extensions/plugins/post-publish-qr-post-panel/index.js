/**
 * External dependencies
 */
import { PanelBody } from '@wordpress/components';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar.js';

/**
 * Internal dependencies
 */
import QRIcon from './components/icon.js';
import QRPost from './components/qr-post.js';
import ImageActionsPanelRow from './components/image-actions-panel-row.js';
import './editor.scss';

export const name = 'post-publish-qr-post-panel';

export const settings = {
	render: function PluginPostPublishPanelQRPost() {
		const qrCodeRef = useRef();

		const panelBodyProps = {
			name: 'post-publish-qr-post-panel',
			title: __( 'QR Code', 'jetpack' ),
			className: 'post-publish-qr-post-panel',
			icon: <QRIcon />,
			initialOpen: true,
		};

		const isPostPublished = useSelect(
			select => select( editorStore ).isCurrentPostPublished(),
			[]
		);

		function QRPostPanelBodyContent() {
			return (
				<>
					<div className="post-publish-qr-post-panel__container" ref={ qrCodeRef }>
						<QRPost />
					</div>

					<ImageActionsPanelRow qrCodeRef={ qrCodeRef } />
				</>
			);
		}

		return (
			<>
				<PluginPostPublishPanel { ...panelBodyProps }>
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
