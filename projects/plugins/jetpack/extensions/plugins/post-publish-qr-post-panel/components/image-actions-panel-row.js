import { PanelRow, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import handleDownloadQRCode from '../utils/handle-download-qrcode.js';

/**
 * Row panel component to address the actions
 * about the QR Code image.
 *
 * @param {object} props           - The component props.
 * @param {string} props.qrCodeRef - The reference to the QR Code image.
 * @returns {object} The component.
 */
export default function QRCodeImageActionsPanelRow( { qrCodeRef } ) {
	const slug = useSelect( select => select( editorStore ).getEditedPostSlug(), [] );

	return (
		<PanelRow>
			<Button isSecondary isSmall onClick={ () => handleDownloadQRCode( slug, qrCodeRef, false ) }>
				{ __( 'View', 'jetpack' ) }
			</Button>

			<Button isSecondary isSmall onClick={ () => handleDownloadQRCode( slug, qrCodeRef ) }>
				{ __( 'Download', 'jetpack' ) }
			</Button>
		</PanelRow>
	);
}
