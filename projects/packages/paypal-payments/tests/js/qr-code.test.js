/**
 * Tests for the frontend QR code script.
 *
 * The QR has to encode the PayPal payment link, not the page the button sits
 * on. The QR format's canvas carries that link in `data-qr-url`, written by the
 * render callback.
 *
 * @package
 */

import QRCode from 'qrcode';

jest.mock( 'qrcode', () => ( { toCanvas: jest.fn() } ) );

const PAYMENT_URL = 'https://www.paypal.com/ncp/payment/PLB-QR123?at_code=WooNCPS_Ecom_Wordpress';

// jsdom has no clipboard. The copy button acts on the write promise resolving.
Object.defineProperty( navigator, 'clipboard', {
	value: { writeText: jest.fn( () => Promise.resolve() ) },
	writable: true,
} );

/**
 * Let the clipboard write promise settle so the button label updates.
 *
 * @return {Promise} Resolves once the pending microtasks have run.
 */
function flushClipboard() {
	return Promise.resolve();
}

/**
 * Render the QR format's markup and run the script against it.
 *
 * @param {string} qrUrl - Value for the canvas `data-qr-url`, or '' to leave it off.
 */
function setUpStandaloneQr( qrUrl = PAYMENT_URL ) {
	document.body.innerHTML = `
		<div class="wp-block-jetpack-paypal-payment-buttons">
			<div class="jetpack-paypal-button jetpack-paypal-button--qr-format">
				<div class="jetpack-paypal-button__qr-standalone">
					<canvas class="jetpack-paypal-button__qr-canvas jetpack-paypal-button__qr-canvas--standalone"${
						qrUrl ? ` data-qr-url="${ qrUrl }"` : ''
					}></canvas>
					<div class="jetpack-paypal-button__qr-link">
						<input type="text" readonly class="jetpack-paypal-button__qr-link-input" value="${ PAYMENT_URL }" />
						<button type="button" class="jetpack-paypal-button__qr-copy" data-copy-label="Copy Link" data-copied-label="Copied!">Copy Link</button>
					</div>
					<button type="button" class="jetpack-paypal-button__qr-download">Download QR Code</button>
				</div>
			</div>
		</div>`;

	jest.isolateModules( () => require( '../../src/paypal-payment-buttons/qr-code' ) );
}

describe( 'QR code frontend script', () => {
	beforeEach( () => {
		QRCode.toCanvas.mockClear();
		navigator.clipboard.writeText.mockClear();
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'encodes the payment link from the canvas on load, with no toggle', () => {
		setUpStandaloneQr();

		expect( QRCode.toCanvas ).toHaveBeenCalledTimes( 1 );
		expect( QRCode.toCanvas.mock.calls[ 0 ][ 1 ] ).toBe( PAYMENT_URL );
	} );

	it( 'never falls back to the page URL', () => {
		setUpStandaloneQr();

		expect( QRCode.toCanvas.mock.calls[ 0 ][ 1 ] ).not.toBe( window.location.href );
	} );

	it( 'draws nothing when the canvas has no URL', () => {
		setUpStandaloneQr( '' );

		expect( QRCode.toCanvas ).not.toHaveBeenCalled();
	} );

	it( 'copies the payment link', async () => {
		setUpStandaloneQr();

		document.querySelector( '.jetpack-paypal-button__qr-copy' ).click();
		await flushClipboard();

		expect( navigator.clipboard.writeText ).toHaveBeenCalledWith( PAYMENT_URL );
	} );

	it( 'confirms the copy on the button, then puts the label back', async () => {
		jest.useFakeTimers();
		setUpStandaloneQr();
		const copyBtn = document.querySelector( '.jetpack-paypal-button__qr-copy' );

		copyBtn.click();
		await flushClipboard();
		expect( copyBtn ).toHaveTextContent( 'Copied!' );

		jest.advanceTimersByTime( 2000 );
		expect( copyBtn ).toHaveTextContent( 'Copy Link' );

		jest.useRealTimers();
	} );

	it( 'leaves the copy button alone when the canvas has no URL', async () => {
		setUpStandaloneQr( '' );

		document.querySelector( '.jetpack-paypal-button__qr-copy' ).click();
		await flushClipboard();

		expect( navigator.clipboard.writeText ).not.toHaveBeenCalled();
	} );
} );
