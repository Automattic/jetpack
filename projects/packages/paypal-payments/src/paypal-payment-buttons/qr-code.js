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
 * Initialize QR code toggles for all PayPal button blocks on the page.
 */
function initQRCodes() {
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

				QRCode.toCanvas( canvas, qrUrl, {
					width: 200,
					margin: 2,
					errorCorrectionLevel: 'M',
					color: {
						dark: '#253B80', // PayPal dark blue
						light: '#FFFFFF',
					},
				} );
				generated = true;
			}

			qrWrapper.style.display = 'block';
			toggle.textContent = toggle.dataset.hideLabel;
			toggle.setAttribute( 'aria-expanded', 'true' );
		} );

		// Download button — convert canvas to PNG.
		if ( downloadBtn ) {
			downloadBtn.addEventListener( 'click', () => {
				const dataUrl = canvas.toDataURL( 'image/png' );
				const link = document.createElement( 'a' );
				link.download = 'paypal-payment-qr.png';
				link.href = dataUrl;
				link.click();
			} );
		}
	} );
}

// Run on DOMContentLoaded.
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initQRCodes );
} else {
	initQRCodes();
}
