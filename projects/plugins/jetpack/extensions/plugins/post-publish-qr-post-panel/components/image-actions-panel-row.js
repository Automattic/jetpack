/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

function handleDownloadCode( slug, ref, download = true ) {
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

	// Convert to bitsmap, and download.
	canvasElement.toBlob( imageBlob => {
		const imageURL = URL.createObjectURL( imageBlob );
		const tempLink = document.createElement( 'a' );
		tempLink.href = imageURL;
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
			<Button isSecondary isSmall onClick={ () => handleDownloadCode( slug, qrCodeRef, false ) }>
				{ __( 'View', 'jetpack' ) }
			</Button>

			<Button isSecondary isSmall onClick={ () => handleDownloadCode( slug, qrCodeRef ) }>
				{ __( 'Download', 'jetpack' ) }
			</Button>
		</PanelRow>
	);
}
