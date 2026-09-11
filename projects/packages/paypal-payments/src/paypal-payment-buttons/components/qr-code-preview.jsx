/**
 * PayPal Payment Buttons — QR code canvas.
 *
 * Draws the payment link as a QR code with the same options the frontend
 * script uses, so the two images match.
 *
 * @package
 */

import { useEffect, useRef } from '@wordpress/element';
import QRCode from 'qrcode';
import { QR_OPTIONS } from '../utils/qr-options';

/**
 * QR code canvas.
 *
 * @param {object} props           - Component props.
 * @param {string} props.url       - The URL to encode, with the attribution code already appended.
 * @param {string} props.className - Class names for the canvas element.
 * @return {?Element} The QR canvas, or nothing until there is a link to encode.
 */
export default function QrCodePreview( { url, className } ) {
	const canvasRef = useRef( null );

	useEffect( () => {
		if ( ! canvasRef.current || ! url ) {
			return;
		}

		// A failed draw leaves the canvas blank rather than breaking the editor.
		QRCode.toCanvas( canvasRef.current, url, QR_OPTIONS ).catch( () => {} );
	}, [ url ] );

	// An undrawn canvas is a blank 300x150 box, which is what a block shows
	// while the merchant is still filling in the form.
	if ( ! url ) {
		return null;
	}

	return <canvas ref={ canvasRef } className={ className } />;
}
