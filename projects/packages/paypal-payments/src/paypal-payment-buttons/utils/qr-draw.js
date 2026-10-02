/**
 * Draw a payment link into a QR canvas.
 *
 * The editor preview and the frontend script both draw through this, so the two match.
 *
 * @package
 */

import QRCode from 'qrcode';
import { QR_OPTIONS } from './qr-options';

/**
 * Draw the URL as a QR code.
 *
 * toCanvas sets an inline display size that beats the stylesheet, so clear it
 * and let Width size the code.
 *
 * @param {HTMLCanvasElement|null} canvas - The canvas to draw into.
 * @param {string}                 url    - The URL to encode.
 * @return {Promise} Settles once the draw finishes. A failed draw leaves the canvas as it was.
 */
export function drawQrCanvas( canvas, url ) {
	if ( ! canvas ) {
		return Promise.resolve();
	}

	if ( ! url ) {
		// Setting width clears the bitmap, so an old code does not show through the
		// pending tint.
		canvas.width = QR_OPTIONS.width;
		return Promise.resolve();
	}

	return QRCode.toCanvas( canvas, url, QR_OPTIONS )
		.then( () => {
			canvas.style.removeProperty( 'width' );
			canvas.style.removeProperty( 'height' );
		} )
		.catch( () => {} );
}
