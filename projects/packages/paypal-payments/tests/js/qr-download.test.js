/**
 * Saving the QR canvas as a PNG.
 *
 * @package
 */

import { downloadQrCanvas } from '../../src/paypal-payment-buttons/utils/qr-download';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe( 'downloadQrCanvas', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'saves the code as a PNG under a fixed name', () => {
		const link = document.createElement( 'a' );
		jest.spyOn( link, 'click' ).mockImplementation( () => {} );
		jest.spyOn( document, 'createElement' ).mockReturnValueOnce( link );
		const canvas = { toDataURL: jest.fn( () => PNG ) };

		downloadQrCanvas( canvas );

		expect( canvas.toDataURL ).toHaveBeenCalledWith( 'image/png' );
		expect( link.download ).toBe( 'paypal-payment-qr.png' );
		expect( link.href ).toBe( PNG );
		expect( link.click ).toHaveBeenCalled();
	} );

	it( 'does nothing without a canvas', () => {
		const createElement = jest.spyOn( document, 'createElement' );

		downloadQrCanvas( null );

		expect( createElement ).not.toHaveBeenCalled();
	} );
} );
