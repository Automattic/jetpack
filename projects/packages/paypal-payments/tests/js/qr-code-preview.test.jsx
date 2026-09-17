/**
 * The QR canvas component as the inspector renders it, with the Download
 * button the canvas preview does not draw.
 *
 * Which element the frame style goes on is covered in paypal-button-preview.test.jsx.
 *
 * @package
 */

import { render, screen } from '@testing-library/react';
import QRCode from 'qrcode';
import QrCodePreview from '../../src/paypal-payment-buttons/components/qr-code-preview';

jest.mock( 'qrcode', () => ( {
	toCanvas: jest.fn( () => Promise.resolve() ),
} ) );

const PAYMENT_URL = 'https://www.paypal.test/ncp/payment/PLB-PREVIEW';

describe( 'QrCodePreview', () => {
	beforeEach( () => {
		QRCode.toCanvas.mockClear();
	} );

	it( 'hides Download until there is a code to save', () => {
		// The button reads the canvas, so offering it early saves a blank PNG.
		render( <QrCodePreview url="" className="jetpack-paypal-button__qr-canvas" showDownload /> );

		expect( screen.queryByRole( 'button', { name: 'Download' } ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the pending code unnamed for the second copy', () => {
		// The canvas preview names it, so naming it here announces it twice.
		render(
			<QrCodePreview
				url=""
				className="jetpack-paypal-button__qr-canvas"
				showPendingLabel={ false }
			/>
		);

		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'captions the code while it is still pending', () => {
		// The component used to render nothing without a link, so the caption went
		// with it.
		render(
			<QrCodePreview
				url=""
				className="jetpack-paypal-button__qr-canvas"
				showCaption
				caption="Scan to pay"
			/>
		);

		expect( screen.getByText( 'Scan to pay' ) ).toBeInTheDocument();
	} );

	it( 'offers Download once the link exists', () => {
		render(
			<QrCodePreview
				url={ PAYMENT_URL }
				className="jetpack-paypal-button__qr-canvas"
				showDownload
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Download' } ) ).toBeInTheDocument();
	} );
} );
