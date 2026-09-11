/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — QR code canvas.
 *
 * Draws the payment link as a QR code with the same options the frontend
 * script uses, so the two images match. Rendered twice — once on the canvas,
 * once in the inspector, where it carries the Download button.
 *
 * @package
 */

import { Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import QRCode from 'qrcode';
import { downloadQrCanvas } from '../utils/qr-download';
import { QR_OPTIONS } from '../utils/qr-options';

/**
 * QR code canvas.
 *
 * @param {object}  props              - Component props.
 * @param {string}  props.url          - The URL to encode, with the attribution code already appended.
 * @param {string}  props.className    - Class names for the canvas element.
 * @param {boolean} props.showDownload - Whether to draw the Download button under the code.
 * @return {?Element} The QR canvas, or nothing until there is a link to encode.
 */
export default function QrCodePreview( { url, className, showDownload } ) {
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

	return (
		<>
			<canvas ref={ canvasRef } className={ className } />
			{ showDownload && (
				<Button
					variant="secondary"
					onClick={ () => downloadQrCanvas( canvasRef.current ) }
					__next40pxDefaultSize
				>
					{ __( 'Download', 'jetpack-paypal-payments' ) }
				</Button>
			) }
		</>
	);
}
