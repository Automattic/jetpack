/**
 * PayPal Payment Buttons — QR Code Frontend Script.
 *
 * Generates a QR code for the PayPal payment link on pages containing
 * a PayPal payment button in the QR format. The link comes from the canvas
 * `data-qr-url` attribute, written by the render callback.
 *
 * Enqueued from the block's render callback, so it only loads on pages
 * that actually render the block.
 * Uses the qrcode npm package (MIT, ~10KB) for canvas-based generation.
 * No external API calls — everything runs client-side.
 *
 * @package
 * @since 0.9.0
 */

import QRCode from 'qrcode';
import { QR_OPTIONS } from './utils/qr-options';

/**
 * Wire a download button to a canvas — convert canvas to PNG on click.
 *
 * @param {HTMLButtonElement|null} downloadBtn - The download button, or null to no-op.
 * @param {HTMLCanvasElement}      canvas      - The QR canvas to export.
 */
function wireDownloadButton( downloadBtn, canvas ) {
	if ( ! downloadBtn ) {
		return;
	}
	downloadBtn.addEventListener( 'click', () => {
		const dataUrl = canvas.toDataURL( 'image/png' );
		const link = document.createElement( 'a' );
		link.download = 'paypal-payment-qr.png';
		link.href = dataUrl;
		link.click();
	} );
}

/**
 * Wire a copy-link button to copy the given URL to the clipboard.
 *
 * @param {HTMLButtonElement|null} copyBtn - The copy button, or null to no-op.
 * @param {string}                 url     - The URL to copy. Empty leaves the button alone.
 */
function wireCopyButton( copyBtn, url ) {
	if ( ! copyBtn || ! url ) {
		return;
	}
	copyBtn.addEventListener( 'click', () => {
		navigator.clipboard.writeText( url ).then( () => {
			const copiedLabel = copyBtn.dataset.copiedLabel || 'Copied!';
			const copyLabel = copyBtn.dataset.copyLabel || copyBtn.textContent;
			copyBtn.textContent = copiedLabel;
			setTimeout( () => {
				copyBtn.textContent = copyLabel;
			}, 2000 );
		} );
	} );
}

/**
 * Initialize standalone QR codes (QR format — no toggle, renders immediately on load).
 *
 * The PHP render callback emits a `<canvas class="jetpack-paypal-button__qr-canvas--standalone"
 * data-qr-url="{url}">` element for each standalone QR code.
 */
function initStandaloneQRCodes() {
	const canvases = document.querySelectorAll( '.jetpack-paypal-button__qr-canvas--standalone' );

	canvases.forEach( canvas => {
		const qrUrl = canvas.dataset.qrUrl;
		if ( ! qrUrl ) {
			return;
		}

		QRCode.toCanvas( canvas, qrUrl, QR_OPTIONS );

		const container = canvas.closest( '.wp-block-jetpack-paypal-payment-buttons' );
		if ( ! container ) {
			return;
		}

		const downloadBtn = container.querySelector( '.jetpack-paypal-button__qr-download' );
		const copyBtn = container.querySelector( '.jetpack-paypal-button__qr-copy' );

		wireDownloadButton( downloadBtn, canvas );
		wireCopyButton( copyBtn, qrUrl );
	} );
}

// Run on DOMContentLoaded.
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initStandaloneQRCodes );
} else {
	initStandaloneQRCodes();
}
