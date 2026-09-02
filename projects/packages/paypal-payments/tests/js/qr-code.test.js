/**
 * Tests for the frontend QR code script.
 *
 * The QR has to encode the PayPal payment link, not the page the button sits
 * on. Both the button's toggle panel and the standalone QR format read that
 * link from the canvas `data-qr-url` attribute the render callback writes.
 *
 * @package
 */

import QRCode from 'qrcode';

jest.mock( 'qrcode', () => ( { toCanvas: jest.fn() } ) );

const PAYMENT_URL = 'https://www.paypal.com/ncp/payment/PLB-QR123?at_code=WooNCPS_Ecom_Wordpress';

/**
 * Render the button panel markup and run the script against it.
 *
 * @param {string} qrUrl - Value for the canvas `data-qr-url`, or '' to leave it off.
 */
function setUpButtonPanel( qrUrl = PAYMENT_URL ) {
	document.body.innerHTML = `
		<div class="wp-block-jetpack-paypal-payment-buttons">
			<div class="jetpack-paypal-button">
				<a href="${ PAYMENT_URL }" class="jetpack-paypal-button__checkout-link wp-element-button">Buy Now</a>
				<div class="jetpack-paypal-button__qr-section">
					<button type="button" class="jetpack-paypal-button__qr-toggle" data-show-label="Show Link or QR Code" data-hide-label="Hide Link or QR Code" aria-expanded="false">Show Link or QR Code</button>
					<div class="jetpack-paypal-button__qr-wrapper" style="display:none;">
						<canvas class="jetpack-paypal-button__qr-canvas"${
							qrUrl ? ` data-qr-url="${ qrUrl }"` : ''
						}></canvas>
						<input type="text" readonly class="jetpack-paypal-button__qr-link-input" value="${ PAYMENT_URL }" />
						<button type="button" class="jetpack-paypal-button__qr-download">Download QR Code</button>
					</div>
				</div>
			</div>
		</div>`;

	jest.isolateModules( () => require( '../../src/paypal-payment-buttons/qr-code' ) );
}

describe( 'QR code frontend script', () => {
	beforeEach( () => {
		QRCode.toCanvas.mockClear();
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'button toggle panel', () => {
		it( 'encodes the payment link from the canvas, not the page URL', () => {
			setUpButtonPanel();

			document.querySelector( '.jetpack-paypal-button__qr-toggle' ).click();

			expect( QRCode.toCanvas ).toHaveBeenCalledTimes( 1 );
			expect( QRCode.toCanvas.mock.calls[ 0 ][ 1 ] ).toBe( PAYMENT_URL );
		} );

		it( 'never falls back to the page URL', () => {
			setUpButtonPanel();

			document.querySelector( '.jetpack-paypal-button__qr-toggle' ).click();

			expect( QRCode.toCanvas.mock.calls[ 0 ][ 1 ] ).not.toBe( window.location.href );
		} );

		it( 'generates once, however many times the panel is toggled', () => {
			setUpButtonPanel();
			const toggle = document.querySelector( '.jetpack-paypal-button__qr-toggle' );

			toggle.click();
			toggle.click();
			toggle.click();

			expect( QRCode.toCanvas ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'still opens the panel when the canvas has no URL', () => {
			setUpButtonPanel( '' );

			document.querySelector( '.jetpack-paypal-button__qr-toggle' ).click();

			const wrapper = document.querySelector( '.jetpack-paypal-button__qr-wrapper' );
			expect( wrapper ).toHaveStyle( { display: 'block' } );
			expect( QRCode.toCanvas ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'standalone QR format', () => {
		it( 'encodes the payment link on load, with no toggle', () => {
			document.body.innerHTML = `
				<div class="wp-block-jetpack-paypal-payment-buttons">
					<canvas class="jetpack-paypal-button__qr-canvas jetpack-paypal-button__qr-canvas--standalone" data-qr-url="${ PAYMENT_URL }"></canvas>
				</div>`;

			jest.isolateModules( () => require( '../../src/paypal-payment-buttons/qr-code' ) );

			expect( QRCode.toCanvas ).toHaveBeenCalledTimes( 1 );
			expect( QRCode.toCanvas.mock.calls[ 0 ][ 1 ] ).toBe( PAYMENT_URL );
		} );
	} );
} );
