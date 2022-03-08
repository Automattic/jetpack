/**
 * External dependencies
 */
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';

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
		return (
			<PluginPrePublishPanel
				name="post-publish-qr-post-panel"
				title={ __( 'QR Code', 'jetpack' ) }
				className="post-publish-qr-post-panel"
				icon={ <QRIcon /> }
				initialOpen={ true }
			>
				<div className="post-publish-qr-post-panel__container" ref={ qrCodeRef }>
					<QRPost />
				</div>

				<ImageActionsPanelRow qrCodeRef={ qrCodeRef } />
			</PluginPrePublishPanel>
		);
	},
};
