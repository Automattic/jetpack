/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — QR code canvas.
 *
 * Draws the payment link as a QR code with the same options the frontend
 * script uses, so the two images match. Rendered twice — once on the canvas,
 * once in the inspector, where it also has the Download button.
 *
 * @package
 */

import { Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { DEFAULT_LABEL } from '../utils/defaults';
import { downloadQrCanvas } from '../utils/qr-download';
import { drawQrCanvas } from '../utils/qr-draw';
import { QR_OPTIONS } from '../utils/qr-options';

// Hoisted: the production build folds a ternary around __() and fails the i18n check.
const PENDING_LABEL = __(
	'The QR code appears once the post is saved.',
	'jetpack-paypal-payments'
);

/**
 * QR code canvas.
 *
 * @param {object}  props                  - Component props.
 * @param {string}  props.url              - The URL to encode, with the attribution code already appended.
 * @param {string}  props.className        - Class names for the canvas element.
 * @param {boolean} props.showDownload     - Whether to draw the Download button under the code.
 * @param {boolean} props.showCaption      - Whether to caption the code. Off by default, matching render_api_managed_button().
 * @param {string}  props.caption          - The caption. Falls back to the shared default when blank.
 * @param {object}  props.captionStyle     - Inline style for the caption.
 * @param {object}  props.frameStyle       - Inline style for the frame — Width, stroke and radius.
 * @param {boolean} props.showPendingLabel - Whether to name the pending code for screen readers. Off for the second copy, or it is announced twice.
 * @return {Element} The framed QR canvas, blank until there is a link to encode.
 */
export default function QrCodePreview( {
	url,
	className,
	showDownload,
	showCaption = false,
	caption,
	captionStyle,
	frameStyle,
	showPendingLabel = true,
} ) {
	const canvasRef = useRef( null );

	useEffect( () => {
		drawQrCanvas( canvasRef.current, url );
	}, [ url ] );

	return (
		<>
			{ /* The border draws here, around the code only, so the caption stays
			     outside it. A radius on the canvas would clip the code. */ }
			<div className="jetpack-paypal-button__qr-frame" style={ frameStyle }>
				{ /* An undrawn canvas defaults to 300x150 and there is no link until
				     the post is saved, so size it here. */ }
				<canvas
					ref={ canvasRef }
					width={ QR_OPTIONS.width }
					height={ QR_OPTIONS.width }
					className={ clsx( className, {
						'jetpack-paypal-button__qr-canvas--pending': ! url,
					} ) }
					role={ ! url && showPendingLabel ? 'img' : undefined }
					aria-label={ ! url && showPendingLabel ? PENDING_LABEL : undefined }
				/>
			</div>
			{ showCaption && (
				<p className="jetpack-paypal-button__qr-caption" style={ captionStyle }>
					{ `${ caption ?? '' }`.trim() || DEFAULT_LABEL }
				</p>
			) }
			{ showDownload && url && (
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
