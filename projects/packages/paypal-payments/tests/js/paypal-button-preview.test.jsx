/* eslint-disable testing-library/no-node-access */
/**
 * Tests for the PayPal Button Preview component.
 *
 * Verifies the editor preview renders product information, button text,
 * layout variants, and prevents click navigation correctly.
 *
 * @package
 */

import { render, screen } from '@testing-library/react';
import QRCode from 'qrcode';
import PayPalButtonPreview from '../../src/paypal-payment-buttons/components/paypal-button-preview';
import { QR_OPTIONS } from '../../src/paypal-payment-buttons/utils/qr-options';

// jsdom has no 2D context, so a real draw fails. Unlike qr-code.test.js's mock
// this one resolves, because the preview chains .catch() on the returned promise.
jest.mock( 'qrcode', () => ( {
	toCanvas: jest.fn( () => Promise.resolve() ),
} ) );

const defaultProps = {
	productName: 'Premium Widget',
	price: '29.99',
	currencyCode: 'USD',
	productDescription: 'A high-quality widget for your needs.',
	paymentLink: 'https://www.paypal.com/ncp/payment/ABC123',
};

describe( 'PayPalButtonPreview', () => {
	it( 'renders the product name', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( 'Premium Widget' ) ).toBeInTheDocument();
	} );

	it( 'renders the formatted price with currency symbol', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( '$29.99' ) ).toBeInTheDocument();
	} );

	it( 'renders the description when provided', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( 'A high-quality widget for your needs.' ) ).toBeInTheDocument();
	} );

	it( 'does not render the description when it is empty', () => {
		render( <PayPalButtonPreview { ...defaultProps } productDescription="" /> );
		expect( screen.queryByText( 'A high-quality widget for your needs.' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the PayPal logo SVG', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		const logo = document.querySelector( '.jetpack-paypal-button__logo' );
		expect( logo ).toBeInTheDocument();
		expect( logo.tagName.toLowerCase() ).toBe( 'svg' );
	} );

	it( 'labels the checkout button with the PayPal wordmark copy', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( 'Buy Now With' ) ).toBeInTheDocument();
	} );

	it( 'never renders a debit/credit button', () => {
		// The theme-native checkout button replaced the PayPal-branded
		// gold + debit/credit pair, so neither layout renders one.
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.queryByText( 'Debit or Credit Card' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the payment link reference', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( 'Payment link:' ) ).toBeInTheDocument();
		expect( screen.getByText( 'https://www.paypal.com/ncp/payment/ABC123' ) ).toBeInTheDocument();
	} );

	it( 'renders non-interactive preview buttons as div elements', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		const button = document.querySelector( '.jetpack-paypal-button-preview__checkout-button' );
		expect( button ).toBeInTheDocument();
		// Preview buttons are divs (not links) — non-interactive in the editor.
		expect( button.tagName ).toBe( 'DIV' );
		expect( button ).toHaveAttribute( 'aria-hidden', 'true' );
		// Theme button styles key off `.wp-element-button`, like the frontend
		// checkout link, so the preview carries it too.
		expect( button ).toHaveClass( 'wp-element-button' );
	} );

	it( 'renders product image when imageUrl is provided', () => {
		render( <PayPalButtonPreview { ...defaultProps } imageUrl="https://example.com/widget.jpg" /> );
		const imageContainer = document.querySelector( '.jetpack-paypal-button-preview__image' );
		expect( imageContainer ).toBeInTheDocument();
		const img = imageContainer.querySelector( 'img' );
		expect( img ).toHaveAttribute( 'src', 'https://example.com/widget.jpg' );
		expect( img ).toHaveAttribute( 'alt', 'Premium Widget' );
	} );

	it( 'does not render product image when imageUrl is not provided', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		const imageContainer = document.querySelector( '.jetpack-paypal-button-preview__image' );
		expect( imageContainer ).not.toBeInTheDocument();
	} );

	it( 'ignores a leftover product price when the options have their own', () => {
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				price="9.99"
				variantsEnabled
				variants={ {
					dimensions: [
						{
							name: 'Size',
							primary: true,
							options: [
								{ label: 'Small', unit_amount: { currency_code: 'USD', value: '12.50' } },
							],
						},
					],
				} }
			/>
		);
		expect( screen.getByText( 'From $12.50' ) ).toBeInTheDocument();
		expect( screen.queryByText( '$9.99' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the cheapest option price when there is no product price', () => {
		// A blank product price with priced options is a legal save.
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				price=""
				variantsEnabled
				variants={ {
					dimensions: [
						{
							name: 'Size',
							primary: true,
							options: [
								{ label: 'Large', unit_amount: { currency_code: 'USD', value: '20.00' } },
								{ label: 'Small', unit_amount: { currency_code: 'USD', value: '12.50' } },
							],
						},
					],
				} }
			/>
		);
		expect( screen.getByText( 'From $12.50' ) ).toBeInTheDocument();
	} );

	it( 'keeps the product price when no option is priced', () => {
		// Options can exist without prices, so the product price stays.
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				price="9.99"
				variantsEnabled
				variants={ {
					dimensions: [
						{
							name: 'Size',
							primary: true,
							options: [ { label: 'Small' }, { label: 'Large' } ],
						},
					],
				} }
			/>
		);
		expect( screen.getByText( '$9.99' ) ).toBeInTheDocument();
	} );

	it( 'ignores a price left on a non-primary option group', () => {
		// PayPal only prices the primary group, so $5.00 is not a price a buyer can pay.
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				price=""
				variantsEnabled
				variants={ {
					dimensions: [
						{
							name: 'Size',
							primary: true,
							options: [
								{ label: 'Small', unit_amount: { currency_code: 'USD', value: '12.50' } },
							],
						},
						{
							name: 'Color',
							primary: false,
							options: [ { label: 'Red', unit_amount: { currency_code: 'USD', value: '5.00' } } ],
						},
					],
				} }
			/>
		);
		expect( screen.getByText( 'From $12.50' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'From $5.00' ) ).not.toBeInTheDocument();
	} );

	// One smoke test per Display Format branch, checking only which preview renders.
	describe( 'Display Format', () => {
		beforeEach( () => {
			QRCode.toCanvas.mockClear();
		} );

		it( 'draws the button card for BUTTON', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="BUTTON" /> );
			expect(
				document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
			).toBeInTheDocument();
		} );

		it( 'draws the button card for a format it does not know', () => {
			// render_api_managed_button() validates the same way server-side.
			render( <PayPalButtonPreview { ...defaultProps } format="STACKED" /> );
			expect(
				document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
			).toBeInTheDocument();
		} );

		it( 'draws the product name as a link for LINK', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="LINK" /> );
			expect( document.querySelector( '.jetpack-paypal-button__paypal-link' ) ).toHaveTextContent(
				'Premium Widget'
			);
		} );

		it( 'falls back to Pay with PayPal when the product has no name', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="LINK" productName="" /> );
			expect( screen.getByText( 'Pay with PayPal' ) ).toBeInTheDocument();
		} );

		it( 'draws a QR canvas for QR', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="QR" /> );
			expect( document.querySelector( '.jetpack-paypal-button__qr-canvas' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Powered by PayPal' ) ).toBeInTheDocument();
			// The label sits under the code, as it does on the frontend.
			expect(
				document.querySelector( '.jetpack-paypal-button__qr-product-name' )
			).toHaveTextContent( 'Premium Widget' );
		} );

		it( 'draws no code until a payment link exists', () => {
			// Until the merchant presses Create New there is nothing to encode, and
			// an undrawn canvas is a blank box.
			render( <PayPalButtonPreview { ...defaultProps } format="QR" paymentLink="" /> );
			expect(
				document.querySelector( '.jetpack-paypal-button__qr-canvas' )
			).not.toBeInTheDocument();
			expect( QRCode.toCanvas ).not.toHaveBeenCalled();
		} );

		it( 'still renders when the draw fails', () => {
			QRCode.toCanvas.mockRejectedValueOnce( new Error( 'no 2d context' ) );
			render( <PayPalButtonPreview { ...defaultProps } format="QR" /> );
			expect( screen.getByText( 'Powered by PayPal' ) ).toBeInTheDocument();
		} );

		it( 'encodes the attributed link, not the bare one', () => {
			// The frontend encodes the link with its at_code. A QR built from the
			// raw link pays through a different URL, and the two images look alike.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					partnerAttributionId="WooNCPS_Ecom_Wordpress"
				/>
			);
			expect( QRCode.toCanvas ).toHaveBeenCalledTimes( 1 );
			const [ , encoded, options ] = QRCode.toCanvas.mock.calls[ 0 ];
			expect( encoded ).toBe(
				'https://www.paypal.com/ncp/payment/ABC123?at_code=WooNCPS_Ecom_Wordpress'
			);
			// The frontend script draws from this same object.
			expect( options ).toBe( QR_OPTIONS );
		} );

		it.each( [ [ 'LINK' ], [ 'QR' ] ] )(
			'leaves out the product card and the payment link row for %s',
			format => {
				render( <PayPalButtonPreview { ...defaultProps } format={ format } /> );
				expect( screen.queryByText( '$29.99' ) ).not.toBeInTheDocument();
				expect( screen.queryByText( 'Payment link:' ) ).not.toBeInTheDocument();
				expect(
					document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
				).not.toBeInTheDocument();
			}
		);
	} );
} );
