/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — QR code canvas.
 *
 * Draws the payment link as a QR code with the same options the frontend
 * script uses, so the two images match. Rendered twice — once on the canvas,
 * once in the inspector, where it also has the Download button. The caption and
 * its blank fallback live here so both copies read the same.
 *
 * @package
 */

import { Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import QRCode from 'qrcode';
import { DEFAULT_LABEL } from '../utils/defaults';
import { downloadQrCanvas } from '../utils/qr-download';
import { QR_OPTIONS } from '../utils/qr-options';

/**
 * QR code canvas.
 *
 * @param {object}  props              - Component props.
 * @param {string}  props.url          - The URL to encode, with the attribution code already appended.
 * @param {string}  props.className    - Class names for the canvas element.
 * @param {boolean} props.showDownload - Whether to draw the Download button under the code.
 * @param {boolean} props.showCaption  - Whether to caption the code. Defaults on, as render_api_managed_button() does.
 * @param {string}  props.caption      - The caption. Falls back to the shared default when blank.
 * @param {object}  props.captionStyle - Inline style for the caption.
 * @return {?Element} The QR canvas, or nothing until there is a link to encode.
 */
export default function QrCodePreview( {
	url,
	className,
	showDownload,
	showCaption = true,
	caption,
	captionStyle,
} ) {
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
			{ showCaption && (
				<p className="jetpack-paypal-button__qr-caption" style={ captionStyle }>
					{ `${ caption ?? '' }`.trim() || DEFAULT_LABEL }
				</p>
			) }
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
