/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Handler function to create an image from the QR code.
 *
 * @param {string} slug      - The slug of the image to create.
 * @param {object} ref       - The ref of the QR code DOM element.
 * @param {boolean} download - Whether to download the image. Defaults to true.
 * @returns {void}           - Nothing when the image is not created.
 */
function handleDownloadQRCode( slug, ref, download = true ) {
	if ( ! slug ) {
		return;
	}

	if ( ! ref?.current ) {
		return;
	}

	const canvasElement = ref.current.querySelector( 'canvas' );
	if ( ! canvasElement ) {
		return;
	}

	// Convert to canvas element to data URL image.
	canvasElement.toBlob( imageBlob => {
		const imageURL = URL.createObjectURL( imageBlob );
		const tempLink = document.createElement( 'a' );
		tempLink.href = imageURL;
		// Download, or not.
		tempLink.setAttribute( download ? 'download' : 'target', `qr-post-${ slug }.png` );
		tempLink.click();
	} );
}

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
