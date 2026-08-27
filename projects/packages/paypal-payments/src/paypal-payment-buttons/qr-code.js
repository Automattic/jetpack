/**
 * PayPal Payment Buttons — QR Code Frontend Script.
 *
 * Generates a QR code for the PayPal payment link on pages containing
 * a PayPal payment button. Falls back to the current page URL for
 * legacy (V1) blocks without a payment link.
 *
 * Enqueued only on relevant pages via has_block() check in PHP.
 * Uses the qrcode npm package (MIT, ~10KB) for canvas-based generation.
 * No external API calls — everything runs client-side.
 *
 * @package
 * @since 0.9.0
 */

import QRCode from 'qrcode';

/**
 * Shared QR generation options.
 */
const QR_OPTIONS = {
	width: 200,
	margin: 2,
	errorCorrectionLevel: 'M',
	color: {
		dark: '#253B80', // PayPal dark blue
		light: '#FFFFFF',
	},
};

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
 * @param {string}                 url     - The URL to copy.
 */
function wireCopyButton( copyBtn, url ) {
	if ( ! copyBtn ) {
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
 * Initialize toggle-based QR codes (BUTTON format with showQrCode enabled).
 */
function initQRToggles() {
	const toggles = document.querySelectorAll( '.jetpack-paypal-button__qr-toggle' );

	toggles.forEach( toggle => {
		const container = toggle.closest( '.wp-block-jetpack-paypal-payment-buttons' );
		if ( ! container ) {
			return;
		}

		const qrWrapper = container.querySelector( '.jetpack-paypal-button__qr-wrapper' );
		const canvas = container.querySelector( '.jetpack-paypal-button__qr-canvas' );

		if ( ! qrWrapper || ! canvas ) {
			return;
		}

		const downloadBtn = container.querySelector( '.jetpack-paypal-button__qr-download' );
		let generated = false;

		toggle.addEventListener( 'click', () => {
			const isVisible = qrWrapper.style.display !== 'none';

			if ( isVisible ) {
				qrWrapper.style.display = 'none';
				toggle.textContent = toggle.dataset.showLabel;
				toggle.setAttribute( 'aria-expanded', 'false' );
				return;
			}

			// Generate QR on first open.
			if ( ! generated ) {
				// Use PayPal payment link if available (V2 API-managed blocks),
				// fall back to page URL for legacy V1 blocks.
				const paymentLink = container.querySelector( '.jetpack-paypal-button__paypal-link' );
				const qrUrl = ( paymentLink && paymentLink.href ) || window.location.href;

				QRCode.toCanvas( canvas, qrUrl, QR_OPTIONS );
				generated = true;
			}

			qrWrapper.style.display = 'block';
			toggle.textContent = toggle.dataset.hideLabel;
			toggle.setAttribute( 'aria-expanded', 'true' );
		} );

		wireDownloadButton( downloadBtn, canvas );
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

/**
 * Initialize all QR code variants on the page.
 */
function initQRCodes() {
	initQRToggles();
	initStandaloneQRCodes();
}

// Run on DOMContentLoaded.
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initQRCodes );
} else {
	initQRCodes();
}
