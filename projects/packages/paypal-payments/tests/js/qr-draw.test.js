/**
 * The shared draw helper.
 *
 * @package
 */

import QRCode from 'qrcode';
import { drawQrCanvas } from '../../src/paypal-payment-buttons/utils/qr-draw';
import { QR_OPTIONS } from '../../src/paypal-payment-buttons/utils/qr-options';

// Sets the inline size the same way qrcode's clearCanvas() does. Without it
// this test would pass whether or not the cleanup runs.
jest.mock( 'qrcode', () => ( {
	toCanvas: jest.fn( canvas => {
		canvas.style.width = '200px';
		canvas.style.height = '200px';
		return Promise.resolve();
	} ),
} ) );

const PAYMENT_URL = 'https://www.paypal.test/ncp/payment/PLB-DRAW';

describe( 'drawQrCanvas', () => {
	beforeEach( () => {
		QRCode.toCanvas.mockClear();
	} );

	it( 'draws at the size the PHP canvas is sized to', () => {
		// QR_SIZE in class-paypal-payment-buttons.php hardcodes the same number, and
		// the published canvas is checked against it. Changing one fails the other.
		expect( QR_OPTIONS.width ).toBe( 200 );
	} );

	it( 'clears the inline size the library sets', async () => {
		const canvas = document.createElement( 'canvas' );

		await drawQrCanvas( canvas, PAYMENT_URL );

		expect( canvas ).not.toHaveStyle( { width: '200px' } );
		expect( canvas ).not.toHaveStyle( { height: '200px' } );
	} );

	it( 'encodes with the shared options, so both sides draw the same image', async () => {
		const canvas = document.createElement( 'canvas' );

		await drawQrCanvas( canvas, PAYMENT_URL );

		expect( QRCode.toCanvas ).toHaveBeenCalledWith( canvas, PAYMENT_URL, QR_OPTIONS );
	} );

	it( 'draws nothing without a canvas', async () => {
		await expect( drawQrCanvas( null, PAYMENT_URL ) ).resolves.toBeUndefined();

		expect( QRCode.toCanvas ).not.toHaveBeenCalled();
	} );

	it( 'draws nothing without a link', async () => {
		await drawQrCanvas( document.createElement( 'canvas' ), '' );

		expect( QRCode.toCanvas ).not.toHaveBeenCalled();
	} );

	it( 'wipes the old code when the link goes away', async () => {
		const canvas = document.createElement( 'canvas' );
		canvas.width = 50;

		await drawQrCanvas( canvas, '' );

		// Setting width is what resets the bitmap, so the old code goes with it.
		expect( canvas.width ).toBe( QR_OPTIONS.width );
	} );

	it( 'swallows a failed draw and leaves the canvas alone', async () => {
		const canvas = document.createElement( 'canvas' );
		canvas.style.width = '200px';
		QRCode.toCanvas.mockRejectedValueOnce( new Error( 'no 2d context' ) );

		await expect( drawQrCanvas( canvas, PAYMENT_URL ) ).resolves.toBeUndefined();
		// Nothing was drawn, so the cleanup is skipped rather than half-applied.
		expect( canvas ).toHaveStyle( { width: '200px' } );
	} );
} );
