/**
 * External dependencies
 */
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { QRIcon } from './components/icons';
import './editor.scss';

export const name = 'post-publish-qr-post-panel';

export const settings = {
	render: function PluginPostPublishPanelQRPost() {
		return (
			<PluginPostPublishPanel
				name="post-publish-qr-post-panel"
				title={ __( 'QR Code', 'jetpack' ) }
				className="post-publish-qr-post-panel"
				icon={ <QRIcon /> }
				initialOpen={ true }
			>
				QR post code here...
			</PluginPostPublishPanel>
		);
	},
};
