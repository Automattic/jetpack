/**
 * Save a QR canvas as a PNG.
 *
 * The frontend's Download button and the inspector's both land here, so the
 * merchant gets the same file either side.
 *
 * @package
 */

export const QR_FILENAME = 'paypal-payment-qr.png';

/**
 * Download the canvas as a PNG.
 *
 * @param {HTMLCanvasElement|null} canvas - The QR canvas. A missing one is a no-op.
 */
export function downloadQrCanvas( canvas ) {
	if ( ! canvas ) {
		return;
	}

	const link = document.createElement( 'a' );
	link.download = QR_FILENAME;
	link.href = canvas.toDataURL( 'image/png' );
	link.click();
}
