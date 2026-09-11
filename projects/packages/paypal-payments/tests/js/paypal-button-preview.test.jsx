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

	it( 'labels the checkout button with buttonText', () => {
		render( <PayPalButtonPreview { ...defaultProps } buttonText="Checkout" /> );
		expect( screen.getByText( 'Checkout' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the default text with no buttonText', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( 'Buy Now' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the default text with a whitespace-only buttonText', () => {
		render( <PayPalButtonPreview { ...defaultProps } buttonText="   " /> );
		expect( screen.getByText( 'Buy Now' ) ).toBeInTheDocument();
	} );

	it( 'keeps the wordmark off the button face', () => {
		// Create 191 puts the branding on the attribution line instead.
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( document.querySelector( '.jetpack-paypal-button__logo' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the attribution line, as the frontend does', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( 'Powered by PayPal' ) ).toBeInTheDocument();
	} );

	it( 'never renders a debit/credit button', () => {
		// The theme-native checkout button replaced the PayPal-branded
		// gold + debit/credit pair, so neither layout renders one.
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.queryByText( 'Debit or Credit Card' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the payment link to the LINK format', () => {
		// Copying the link belongs to the LINK format and the Payment Links admin
		// screen. The published button has none, so the canvas matches it.
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.queryByText( 'Payment link:' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Copy' ) ).not.toBeInTheDocument();
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

	// The canvas and render_api_managed_button() have to draw the same summary,
	// so these mirror the frontend's rules.
	describe( 'variant summary', () => {
		const sized = {
			dimensions: [
				{
					name: 'Size',
					primary: true,
					options: [
						{ label: 'Small', unit_amount: { currency_code: 'USD', value: '12.50' } },
						{ label: 'Large', unit_amount: { currency_code: 'USD', value: '20.00' } },
					],
				},
			],
		};

		it( 'draws the labeled group the frontend draws, not a count badge', () => {
			render(
				<PayPalButtonPreview { ...defaultProps } price="" variantsEnabled variants={ sized } />
			);
			expect( screen.getByText( 'Options available — select at checkout:' ) ).toBeInTheDocument();
			expect( document.querySelector( '.jetpack-paypal-button__variant-name' ) ).toHaveTextContent(
				'Size:'
			);
			expect( screen.getByText( 'Small' ) ).toHaveClass( 'jetpack-paypal-button__variant-option' );
			expect( screen.getByText( '$20.00' ) ).toHaveClass( 'jetpack-paypal-button__variant-price' );
		} );

		it( 'hides an option price that only repeats the product price', () => {
			// Only a non-primary group gets here: a priced primary group blanks
			// the product price first, in both renderers.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					price="29.99"
					variantsEnabled
					variants={ {
						dimensions: [
							{
								name: 'Color',
								options: [
									{ label: 'Red', unit_amount: { currency_code: 'USD', value: '29.99' } },
									{ label: 'Blue', unit_amount: { currency_code: 'USD', value: '35.00' } },
								],
							},
						],
					} }
				/>
			);
			expect( screen.getByText( '$35.00' ) ).toHaveClass( 'jetpack-paypal-button__variant-price' );
			expect( screen.queryAllByText( '$29.99' ) ).toHaveLength( 1 );
		} );

		it( 'skips a nameless group and an unlabeled option', () => {
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					variantsEnabled
					variants={ {
						dimensions: [
							{ name: '', primary: true, options: [ { label: 'Small' } ] },
							{ name: 'Color', options: [ { label: '' } ] },
						],
					} }
				/>
			);
			expect(
				document.querySelector( '.jetpack-paypal-button__variants' )
			).not.toBeInTheDocument();
		} );

		it( 'shows an option price of 0', () => {
			// PayPal accepts a price of 0.
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
									{ label: 'Free', unit_amount: { currency_code: 'USD', value: '0' } },
									{ label: 'Large', unit_amount: { currency_code: 'USD', value: '20.00' } },
								],
							},
						],
					} }
				/>
			);
			expect( screen.getByText( '$0' ) ).toHaveClass( 'jetpack-paypal-button__variant-price' );
		} );

		it( 'shows a product price of 0', () => {
			render( <PayPalButtonPreview { ...defaultProps } price="0" /> );
			expect( screen.getByText( '$0' ) ).toHaveClass(
				'jetpack-paypal-button-preview__product-price'
			);
		} );

		it( 'keeps a group named 0 and an option labeled 0', () => {
			// '0' passes the form's validation, so both renderers have to keep it.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					variantsEnabled
					variants={ {
						dimensions: [
							{ name: 'Size', primary: true, options: [ { label: '0' } ] },
							{ name: '0', options: [ { label: 'Red' } ] },
						],
					} }
				/>
			);
			expect( screen.getByText( 'Size:' ) ).toBeInTheDocument();
			expect( screen.getByText( '0:' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Red' ) ).toBeInTheDocument();
		} );

		it( 'draws nothing when variants are off', () => {
			render( <PayPalButtonPreview { ...defaultProps } variants={ sized } /> );
			expect(
				document.querySelector( '.jetpack-paypal-button__variants' )
			).not.toBeInTheDocument();
		} );
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
			render( <PayPalButtonPreview { ...defaultProps } format="QR" qrShowCaption /> );
			expect( document.querySelector( '.jetpack-paypal-button__qr-canvas' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Powered by PayPal' ) ).toBeInTheDocument();
			// The caption sits under the code, as it does on the frontend.
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toHaveTextContent(
				'Buy Now'
			);
		} );

		it( 'draws the caption the merchant typed', () => {
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					qrShowCaption
					qrCaption="Scan to pay"
				/>
			);
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toHaveTextContent(
				'Scan to pay'
			);
		} );

		it( 'drops the caption when Show text under QR code is off', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="QR" qrShowCaption={ false } /> );
			expect(
				document.querySelector( '.jetpack-paypal-button__qr-caption' )
			).not.toBeInTheDocument();
			// The code itself is unaffected.
			expect( document.querySelector( '.jetpack-paypal-button__qr-canvas' ) ).toBeInTheDocument();
		} );

		it( 'puts Width and Border Settings on the wrapper, and caption styles on the caption', () => {
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					qrShowCaption
					attributes={ {
						blockWidth: '50%',
						marginVertical: 12,
						marginHorizontal: 4,
						blockBorderRadius: 8,
						blockBorderWidth: 2,
						blockBorderColor: '#ff0000',
						captionColor: '#0000ff',
						captionFontSize: 20,
					} }
				/>
			);

			const wrapper = document.querySelector( '.jetpack-paypal-button-preview--qr' );
			expect( wrapper ).toHaveStyle( {
				maxWidth: '50%',
				margin: '12px 4px',
				borderRadius: '8px',
				border: '2px solid #ff0000',
			} );
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toHaveStyle( {
				color: '#0000ff',
				fontSize: '20px',
			} );
		} );

		it( 'draws no border when the stroke has a width but no color', () => {
			// Without a color the browser falls back to currentColor and draws a
			// border the merchant never chose.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					attributes={ { blockBorderWidth: 4, blockBorderRadius: 8 } }
				/>
			);

			const wrapper = document.querySelector( '.jetpack-paypal-button-preview--qr' );
			// The radius still applies, so this proves the gate and not an empty style.
			expect( wrapper ).toHaveStyle( { borderRadius: '8px' } );
			expect( wrapper ).not.toHaveStyle( { borderStyle: 'solid' } );
		} );

		it( 'captions the code when the toggle was never touched', () => {
			// render_api_managed_button() defaults it on, so the canvas must too.
			render( <PayPalButtonPreview { ...defaultProps } format="QR" /> );
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toHaveTextContent(
				'Buy Now'
			);
		} );

		it( 'keeps a margin set on one axis only', () => {
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					attributes={ { marginVertical: 12 } }
				/>
			);
			expect( document.querySelector( '.jetpack-paypal-button-preview--qr' ) ).toHaveStyle( {
				margin: '12px 0',
			} );
		} );

		it( 'styles the button card too', () => {
			// Width and Border are BUTTON and QR both, so the same helper feeds both.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="BUTTON"
					attributes={ { blockWidth: '75%', blockBorderRadius: 6 } }
				/>
			);
			expect( document.querySelector( '.jetpack-paypal-button-preview' ) ).toHaveStyle( {
				maxWidth: '75%',
				borderRadius: '6px',
			} );
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

		it.each( [ [ 'LINK' ], [ 'QR' ] ] )( 'leaves out the product card for %s', format => {
			render( <PayPalButtonPreview { ...defaultProps } format={ format } /> );
			expect( screen.queryByText( '$29.99' ) ).not.toBeInTheDocument();
			expect(
				document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
			).not.toBeInTheDocument();
		} );
	} );
} );
