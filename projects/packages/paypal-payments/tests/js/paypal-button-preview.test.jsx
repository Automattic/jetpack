/* eslint-disable testing-library/no-node-access */
/**
 * Tests for the PayPal Button Preview component.
 *
 * Verifies the editor preview renders product information, button text,
 * layout variants, and prevents click navigation correctly.
 *
 * @package
 */

import { act, render, screen } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import QRCode from 'qrcode';
import metadata from '../../src/paypal-payment-buttons/block.json';
import PayPalButtonPreview from '../../src/paypal-payment-buttons/components/paypal-button-preview';
import { QR_OPTIONS } from '../../src/paypal-payment-buttons/utils/qr-options';
import {
	forgetSyncedRequests,
	recordPaymentRead,
	syncBlocksBeforeSave,
} from '../../src/paypal-payment-buttons/utils/sync-on-save';
import cardParity from '../fixtures/product-card-parity.json';
import bootTheFrame from './boot-the-frame';

// jsdom has no 2D context, so a real draw fails. Unlike qr-code.test.js's mock
// this one resolves, because the preview chains .catch() on the returned promise.
jest.mock( 'qrcode', () => ( {
	toCanvas: jest.fn( () => Promise.resolve() ),
} ) );

// Only the saving flag, which core/editor sets while the sync runs.
jest.mock( '@wordpress/editor', () => {
	const { createReduxStore, register } = jest.requireActual( '@wordpress/data' );
	const store = createReduxStore( 'core/editor', {
		reducer: ( saving = false, action ) =>
			'SET_SAVING' === action.type ? action.saving : saving,
		actions: { setSaving: saving => ( { type: 'SET_SAVING', saving } ) },
		selectors: { isSavingPost: saving => saving },
	} );
	register( store );
	return { store };
} );

const SDK_HOST_URL = 'https://example.test/wp-admin/admin-post.php?action=jetpack_paypal_sdk_host';

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

	// An empty currencyCode is '' rather than undefined, so the prop default never fires
	// and the fallback in the option list is the one that does.
	it( 'prices the options in USD when the block carries no currency', () => {
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				price=""
				currencyCode=""
				variantsEnabled={ true }
				variants={ {
					dimensions: [
						{
							name: 'Size',
							primary: true,
							options: [ { label: 'Small', unit_amount: { value: '4.50' } } ],
						},
					],
				} }
			/>
		);

		expect( screen.getByText( '$4.50' ) ).toBeInTheDocument();
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
		expect( screen.getByText( 'Buy now' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the default text with a whitespace-only buttonText', () => {
		render( <PayPalButtonPreview { ...defaultProps } buttonText="   " /> );
		expect( screen.getByText( 'Buy now' ) ).toBeInTheDocument();
	} );

	it( 'keeps the wordmark off the button face', () => {
		// The branding reads on the attribution line, not the button face.
		render(
			<PayPalButtonPreview { ...defaultProps } attributes={ { buttonShowPoweredBy: true } } />
		);
		const button = document.querySelector( '.jetpack-paypal-button-preview__checkout-button' );
		expect( button.querySelector( '.jetpack-paypal-button__logo' ) ).not.toBeInTheDocument();
		// Positive control: the wordmark is on the attribution line.
		expect(
			document.querySelector( '.jetpack-paypal-button__attribution .jetpack-paypal-button__logo' )
		).toBeInTheDocument();
	} );

	it( 'shows the attribution line by default', () => {
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				attributes={ { buttonShowPoweredBy: metadata.attributes.buttonShowPoweredBy.default } }
			/>
		);
		expect( document.querySelector( '.jetpack-paypal-button__attribution' ) ).toBeInTheDocument();
	} );

	it( 'hides the attribution line when buttonShowPoweredBy is false', () => {
		render(
			<PayPalButtonPreview { ...defaultProps } attributes={ { buttonShowPoweredBy: false } } />
		);
		expect(
			document.querySelector( '.jetpack-paypal-button__attribution' )
		).not.toBeInTheDocument();
	} );

	it( 'renders "Powered by" and the PayPal wordmark, as the frontend does', () => {
		render(
			<PayPalButtonPreview { ...defaultProps } attributes={ { buttonShowPoweredBy: true } } />
		);
		// Same markup as the PHP test, except Jest stubs the image src to its file name.
		// Note React 18 and React 19 produce different attribute orders, and `.toContainHTML()` doesn't normalize, sigh.
		const container = document.createElement( 'div' );
		container.innerHTML =
			'<p class="jetpack-paypal-button__attribution">Powered by <img class="jetpack-paypal-button__logo" src="paypal-wordmark-color.svg" alt="PayPal" width="42" height="15"></p>';
		expect( document.querySelector( '.jetpack-paypal-button__attribution' ) ).toEqual(
			container.firstChild
		);
	} );

	// The canvas half of what render_api_managed_button() puts on the anchor.
	// Without these the class and style wiring can be removed and the suite
	// still passes.
	it( 'styles the checkout button from its own color, background and size', () => {
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				attributes={ {
					buttonTextColor: '#1e1e1e',
					buttonBackgroundColor: '#ffd140',
					buttonFontSize: '18px',
				} }
			/>
		);

		expect(
			document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
		).toHaveStyle( { color: '#1e1e1e', backgroundColor: '#ffd140', fontSize: '18px' } );
	} );

	it( 'marks the outline style and drops the background with it', () => {
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				attributes={ {
					buttonStyle: 'outline',
					buttonTextColor: '#1e1e1e',
					buttonBackgroundColor: '#ffd140',
				} }
			/>
		);

		const button = document.querySelector( '.jetpack-paypal-button-preview__checkout-button' );
		expect( button ).toHaveClass( 'is-style-outline' );
		// The transparent background comes from the stylesheet, so an inline one
		// would beat it and fill the button back in.
		expect( button ).not.toHaveStyle( { backgroundColor: '#ffd140' } );
		expect( button ).toHaveStyle( { color: '#1e1e1e' } );
	} );

	it( 'leaves the outline class off the fill style', () => {
		render( <PayPalButtonPreview { ...defaultProps } attributes={ { buttonStyle: 'fill' } } /> );
		expect(
			document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
		).not.toHaveClass( 'is-style-outline' );
	} );

	it( 'grays the button before the link exists', () => {
		render( <PayPalButtonPreview { ...defaultProps } isDisabled /> );
		expect(
			document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
		).toHaveClass( 'is-disabled' );
	} );

	it( 'drops the gray once the link exists', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect(
			document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
		).not.toHaveClass( 'is-disabled' );
	} );

	// Create new keeps the block's Styles attributes. Their inline colors and
	// outline class would override the gray.
	it( 'drops the button Styles settings while gray', () => {
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				isDisabled
				attributes={ {
					buttonStyle: 'outline',
					buttonTextColor: '#1e1e1e',
					buttonBackgroundColor: '#ffd140',
				} }
			/>
		);

		const button = document.querySelector( '.jetpack-paypal-button-preview__checkout-button' );
		expect( button ).not.toHaveClass( 'is-style-outline' );
		expect( button ).not.toHaveAttribute( 'style' );
	} );

	// Border stays on the button, since the card has no background for a radius
	// to round.
	it( 'sizes the card and borders the button', () => {
		render(
			<PayPalButtonPreview
				{ ...defaultProps }
				attributes={ {
					blockWidth: '75%',
					style: {
						border: { radius: '8px', width: '2px', color: '#1e1e1e' },
						spacing: { margin: { top: '8px' } },
					},
				} }
			/>
		);

		const button = document.querySelector( '.jetpack-paypal-button-preview__checkout-button' );
		expect( button ).toHaveStyle( {
			borderRadius: '8px',
			borderWidth: '2px',
			borderColor: '#1e1e1e',
			borderStyle: 'solid',
		} );
		// Width goes on the card. The regex matches at the start of a declaration,
		// so it skips border-width.
		expect( button.getAttribute( 'style' ) ).not.toMatch( /(^|;)\s*(max-)?width:/ );

		// The card takes Width and drops a margin left over from QR.
		const card = document.querySelector( '.jetpack-paypal-button-preview' );
		expect( card ).toHaveStyle( { width: '75%', maxWidth: '100%' } );
		expect( card.getAttribute( 'style' ) ).not.toMatch( /margin|border/ );
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

	// style.scss sets the block's width, margin and font on this class.
	it( 'adds the jetpack-paypal-button class to the button and QR previews', () => {
		const { rerender } = render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( document.querySelector( '.jetpack-paypal-button-preview' ) ).toHaveClass(
			'jetpack-paypal-button'
		);

		rerender( <PayPalButtonPreview { ...defaultProps } format="QR" /> );
		expect( document.querySelector( '.jetpack-paypal-button-preview--qr' ) ).toHaveClass(
			'jetpack-paypal-button'
		);
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
		// The frontend checkout link's class, for the same layout rules.
		expect( button ).toHaveClass( 'jetpack-paypal-button__checkout-link' );
	} );

	it( 'renders product image when imageUrl is provided', () => {
		render( <PayPalButtonPreview { ...defaultProps } imageUrl="https://example.com/widget.jpg" /> );
		const imageContainer = document.querySelector( '.jetpack-paypal-button__product-image' );
		expect( imageContainer ).toBeInTheDocument();
		const img = imageContainer.querySelector( 'img' );
		expect( img ).toHaveAttribute( 'src', 'https://example.com/widget.jpg' );
		expect( img ).toHaveAttribute( 'alt', 'Premium Widget' );
	} );

	it( 'does not render product image when imageUrl is not provided', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		const imageContainer = document.querySelector( '.jetpack-paypal-button__product-image' );
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
			expect( screen.getByText( '$0' ) ).toHaveClass( 'jetpack-paypal-button__product-price' );
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
			window.jetpackPayPalPayments = { sdkHostUrl: SDK_HOST_URL };
		} );

		afterEach( () => {
			delete window.jetpackPayPalPayments;
		} );

		it( 'draws the button card for BUTTON', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="BUTTON" /> );
			expect(
				document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
			).toBeInTheDocument();
		} );

		it( 'draws the SDK preview for STACKED', () => {
			// PayPal draws the whole card from one container, so the button card gives way.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="STACKED"
					attributes={ {
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=abc',
						resourceId: 'PLB-1',
					} }
				/>
			);

			expect( screen.getByTitle( 'PayPal buttons preview' ) ).toBeInTheDocument();
			expect(
				document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
			).not.toBeInTheDocument();
		} );

		const usd = 'https://www.paypal.com/sdk/js?client-id=abc&currency=USD';
		const stacked = ( attributes, resource ) => (
			<PayPalButtonPreview
				{ ...defaultProps }
				format="STACKED"
				attributes={ attributes }
				resource={ resource }
			/>
		);

		it.each( [
			[
				'the URL changes',
				'scriptSrc',
				'https://www.paypal.com/sdk/js?client-id=abc&currency=EUR',
			],
			[ 'the payment changes', 'resourceId', 'PLB-2' ],
		] )( 'boots the SDK again when %s', ( _label, key, changed ) => {
			const before = { scriptSrc: usd, resourceId: 'PLB-1' };

			const { rerender } = render( stacked( before ) );
			expect( bootTheFrame().doc.querySelector( 'script' ) ).not.toBeNull();

			rerender( stacked( { ...before, [ key ]: changed } ) );
			const script = bootTheFrame().doc.querySelector( 'script' );
			expect( script ).not.toBeNull();
			expect( script.src ).toBe( 'scriptSrc' === key ? changed : usd );
		} );

		// The frame is keyed on the SDK URL, payment id, and card revision, so typing in the
		// sidebar keeps PayPal's SDK running.
		it( 'leaves the running SDK alone when another attribute changes', () => {
			const before = { scriptSrc: usd, resourceId: 'PLB-1', productName: 'Premium Widget' };

			const { rerender } = render( stacked( before ) );
			expect( bootTheFrame().doc.querySelector( 'script' ) ).not.toBeNull();

			rerender( stacked( { ...before, productName: 'Deluxe Widget' } ) );
			// A remount would boot into this second document; the first mount's frame
			// carries on drawing instead.
			expect( bootTheFrame().doc.querySelector( 'script' ) ).toBeNull();
		} );

		it( 'boots the SDK from the read URL when the read finishes after the first render', () => {
			const attributes = { resourceId: 'PLB-1' };

			const { rerender } = render( stacked( attributes ) );
			expect( screen.queryByTitle( 'PayPal buttons preview' ) ).not.toBeInTheDocument();

			rerender( stacked( attributes, { id: 'PLB-1', sdk_url: usd } ) );
			expect( screen.getByTitle( 'PayPal buttons preview' ) ).toHaveAttribute(
				'src',
				SDK_HOST_URL
			);
			expect( bootTheFrame().doc.querySelector( 'script' ).src ).toBe( usd );
		} );

		it( 'leaves the running SDK alone when the read finishes for a block with a scriptSrc', () => {
			const attributes = { scriptSrc: usd, resourceId: 'PLB-1' };

			const { rerender } = render( stacked( attributes ) );
			expect( bootTheFrame().doc.querySelector( 'script' ) ).not.toBeNull();

			rerender( stacked( attributes, { id: 'PLB-1', sdk_url: `${ usd }&enable-funding=venmo` } ) );
			expect( bootTheFrame().doc.querySelector( 'script' ) ).toBeNull();
		} );

		describe( 'after a save', () => {
			const payment = { ...defaultProps, collectShippingAddress: false };
			const block = { ...payment, format: 'STACKED', isApiManaged: true, resourceId: 'PLB-1' };

			/**
			 * Save the block the way core/editor does, with a PUT that succeeds.
			 *
			 * @param {object} attributes - The block's attributes at the save.
			 */
			const save = async attributes => {
				await act( () => dispatch( editorStore ).setSaving( true ) );
				await syncBlocksBeforeSave( [ { clientId: 'a', attributes } ], {
					request: () => Promise.resolve( {} ),
					updateBlockAttributes: jest.fn(),
					reportError: jest.fn(),
					reportHeldBack: jest.fn(),
				} );
				await act( () => dispatch( editorStore ).setSaving( false ) );
			};

			beforeEach( () => {
				forgetSyncedRequests();
				recordPaymentRead( 'a', 'PLB-1', payment );
			} );

			// A new SDK load fetches the updated card from PayPal.
			it( 'boots the SDK again after a save that changes the payment', async () => {
				render( stacked( { scriptSrc: usd, resourceId: 'PLB-1' } ) );
				expect( bootTheFrame().doc.querySelector( 'script' ) ).not.toBeNull();

				await save( { ...block, productName: 'Deluxe Widget' } );

				expect( bootTheFrame().doc.querySelector( 'script' ) ).not.toBeNull();
			} );

			it( 'leaves the running SDK alone after a save that writes the payment unchanged', async () => {
				render( stacked( { scriptSrc: usd, resourceId: 'PLB-1' } ) );
				expect( bootTheFrame().doc.querySelector( 'script' ) ).not.toBeNull();

				await save( block );

				expect( bootTheFrame().doc.querySelector( 'script' ) ).toBeNull();
			} );

			it( 'leaves the running SDK alone when a save changes another payment', async () => {
				render( stacked( { scriptSrc: usd, resourceId: 'PLB-2' } ) );
				expect( bootTheFrame().doc.querySelector( 'script' ) ).not.toBeNull();

				await save( { ...block, productName: 'Deluxe Widget' } );

				expect( bootTheFrame().doc.querySelector( 'script' ) ).toBeNull();
			} );
		} );

		it( 'draws the button card for a format it does not know', () => {
			// render_api_managed_button() validates the same way server-side.
			render( <PayPalButtonPreview { ...defaultProps } format="NOT_A_FORMAT" /> );
			expect(
				document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
			).toBeInTheDocument();
		} );

		it( 'draws the link text as the label for LINK', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="LINK" linkText="Get yours" /> );
			expect( document.querySelector( '.jetpack-paypal-button__paypal-link' ) ).toHaveTextContent(
				'Get yours'
			);
		} );

		it( 'falls back to the default label when the link text is blank', () => {
			// A blank label falls back the way the button face and the caption do,
			// and the product name does not stand in for it.
			render( <PayPalButtonPreview { ...defaultProps } format="LINK" linkText="   " /> );
			expect( document.querySelector( '.jetpack-paypal-button__paypal-link' ) ).toHaveTextContent(
				'Buy now'
			);
		} );

		it( 'styles the link from its own color and size', () => {
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="LINK"
					attributes={ { linkColor: '#0000ff', linkFontSize: '20px' } }
				/>
			);
			expect( document.querySelector( '.jetpack-paypal-button__paypal-link' ) ).toHaveStyle( {
				color: '#0000ff',
				fontSize: '20px',
			} );
		} );

		// paymentLink is a plain block attribute, so post content decides what the canvas
		// links to and what the QR encodes.
		describe.each( [
			[ 'another host', 'https://evil.test/ncp/payment/ABC123' ],
			[ 'a javascript: URL wearing a PayPal host', 'javascript://www.paypal.com/%0aalert(1)' ],
		] )( 'a payment link on %s', ( _label, paymentLink ) => {
			it( 'leaves the href empty', () => {
				render(
					<PayPalButtonPreview { ...defaultProps } format="LINK" paymentLink={ paymentLink } />
				);

				expect( document.querySelector( '.jetpack-paypal-button__paypal-link' ) ).toHaveAttribute(
					'href',
					''
				);
			} );

			it( 'leaves the QR pending', () => {
				render(
					<PayPalButtonPreview { ...defaultProps } format="QR" paymentLink={ paymentLink } />
				);

				expect( QRCode.toCanvas ).not.toHaveBeenCalled();
				expect( document.querySelector( '.jetpack-paypal-button__qr-canvas' ) ).toHaveClass(
					'jetpack-paypal-button__qr-canvas--pending'
				);
			} );
		} );

		it( 'draws a QR canvas for QR', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="QR" qrShowCaption /> );
			expect( document.querySelector( '.jetpack-paypal-button__qr-canvas' ) ).toBeInTheDocument();
			// The caption sits under the code, as it does on the frontend.
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toHaveTextContent(
				'Buy now'
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

		it( 'splits margin onto the card and Width and the stroke onto the frame', () => {
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					qrShowCaption
					attributes={ {
						blockWidth: '50%',
						style: {
							spacing: { margin: { top: '12px', bottom: '12px', left: '4px', right: '4px' } },
							border: { radius: '8px', width: '2px', color: '#ff0000' },
						},
						captionColor: '#0000ff',
						captionFontSize: '20px',
					} }
				/>
			);

			const card = document.querySelector( '.jetpack-paypal-button-preview--qr' );
			expect( card ).toHaveStyle( {
				marginTop: '12px',
				marginBottom: '12px',
				marginLeft: '4px',
				marginRight: '4px',
			} );
			// The stroke goes on the frame only.
			expect( card ).not.toHaveStyle( { borderWidth: '2px' } );
			expect( card ).not.toHaveStyle( { width: '50%' } );

			const frame = document.querySelector( '.jetpack-paypal-button__qr-frame' );
			expect( frame ).toHaveStyle( {
				width: '50%',
				maxWidth: '100%',
				borderRadius: '8px',
				borderWidth: '2px',
				borderColor: '#ff0000',
				borderStyle: 'solid',
			} );

			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toHaveStyle( {
				color: '#0000ff',
				fontSize: '20px',
			} );
		} );

		it( 'wraps the code alone, leaving the caption outside the frame', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="QR" qrShowCaption /> );

			const frame = document.querySelector( '.jetpack-paypal-button__qr-frame' );
			expect( frame.querySelector( '.jetpack-paypal-button__qr-canvas' ) ).toBeInTheDocument();
			expect( frame.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toBeNull();
		} );

		it( 'draws a stroke on the width alone', () => {
			// border-style defaults to `none`, so the width sets a style too.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					attributes={ { style: { border: { width: '4px', radius: '8px' } } } }
				/>
			);

			expect( document.querySelector( '.jetpack-paypal-button__qr-frame' ) ).toHaveStyle( {
				borderRadius: '8px',
				borderWidth: '4px',
				borderStyle: 'solid',
			} );
		} );

		it( 'leaves the code bare when the toggle was never touched', () => {
			// render_api_managed_button() defaults it off, so the canvas must too.
			render( <PayPalButtonPreview { ...defaultProps } format="QR" /> );
			expect( document.querySelector( '.jetpack-paypal-button__qr-canvas' ) ).toBeInTheDocument();
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toBeNull();
		} );

		it( 'falls back to the default label once the caption is on', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="QR" qrShowCaption /> );
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toHaveTextContent(
				'Buy now'
			);
		} );

		it( 'leaves the other axis to the stylesheet when only one is set', () => {
			// The published page emits only the sides that are set, so the canvas
			// must not zero-fill the rest.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					attributes={ {
						style: { spacing: { margin: { left: '8px', right: '8px' } } },
					} }
				/>
			);
			const wrapper = document.querySelector( '.jetpack-paypal-button-preview--qr' );
			expect( wrapper ).toHaveStyle( { marginLeft: '8px', marginRight: '8px' } );
			expect( wrapper ).not.toHaveStyle( { marginTop: '8px' } );
		} );

		it( "keeps the code's footprint until a payment link exists", () => {
			// PayPal issues the link on save. Until then the canvas is sized but
			// never drawn into, so the block stays the same size.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					paymentLink=""
					attributes={ { blockWidth: '50%' } }
				/>
			);

			const canvas = screen.getByRole( 'img', {
				name: 'The QR code appears once the post is saved.',
			} );
			expect( canvas ).toHaveClass( 'jetpack-paypal-button__qr-canvas--pending' );
			expect( canvas ).toHaveAttribute( 'width', '200' );
			expect( canvas ).toHaveAttribute( 'height', '200' );
			// Inside the frame, so the Width setting and the stroke apply to it too.
			expect( document.querySelector( '.jetpack-paypal-button__qr-frame' ) ).toContainElement(
				canvas
			);
			expect( document.querySelector( '.jetpack-paypal-button__qr-frame' ) ).toHaveStyle( {
				width: '50%',
			} );
			expect( QRCode.toCanvas ).not.toHaveBeenCalled();
		} );

		it( 'renders the code bare once there is a link to encode', () => {
			render( <PayPalButtonPreview { ...defaultProps } format="QR" /> );

			const canvas = document.querySelector( '.jetpack-paypal-button__qr-canvas' );
			expect( canvas ).toHaveAttribute( 'width', '200' );
			expect( canvas ).toHaveAttribute( 'height', '200' );
			expect( canvas ).not.toHaveClass( 'jetpack-paypal-button__qr-canvas--pending' );
			expect( canvas ).not.toHaveAttribute( 'aria-label' );
			expect( QRCode.toCanvas ).toHaveBeenCalled();
		} );

		it( 'still renders when the draw fails', () => {
			QRCode.toCanvas.mockRejectedValueOnce( new Error( 'no 2d context' ) );
			render( <PayPalButtonPreview { ...defaultProps } format="QR" qrShowCaption /> );
			expect( document.querySelector( '.jetpack-paypal-button__qr-caption' ) ).toBeInTheDocument();
		} );

		it( 'leaves the attribution line off the QR', () => {
			// The button carries the branding; the QR does not.
			render(
				<PayPalButtonPreview
					{ ...defaultProps }
					format="QR"
					attributes={ { buttonShowPoweredBy: true } }
				/>
			);
			expect(
				document.querySelector( '.jetpack-paypal-button__attribution' )
			).not.toBeInTheDocument();
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

	describe( 'discounted card', () => {
		const sizes = {
			dimensions: [
				{
					name: 'size',
					primary: true,
					options: [
						{ label: 'small', unit_amount: { value: '20.00' } },
						{ label: 'large', unit_amount: { value: '30.00' } },
					],
				},
			],
		};
		const options = { price: '', variantsEnabled: true, variants: sizes };

		// The editor passes the content as props and the whole block as `attributes`,
		// so the discount reaches the preview through `attributes` alone.
		const preview = attributes => (
			<PayPalButtonPreview
				{ ...defaultProps }
				productName={ attributes.productName }
				price={ attributes.price }
				currencyCode={ attributes.currencyCode }
				productDescription={ attributes.productDescription }
				variantsEnabled={ attributes.variantsEnabled }
				variants={ attributes.variants }
				attributes={ attributes }
			/>
		);
		const block = ( price, discountType, discountValue, extra = {} ) => ( {
			productName: 'Widget',
			price,
			currencyCode: 'USD',
			discountEnabled: true,
			discountType,
			discountValue,
			...extra,
		} );
		const struck = ( original, discounted ) =>
			`<s class="jetpack-paypal-button__original-price">${ original }</s> ${ discounted }`;
		const chip = ( label, original, discounted ) =>
			`${ label } <span class="jetpack-paypal-button__variant-price">${ struck( original, discounted ) }</span>`;

		const headline = () =>
			document.querySelector( '.jetpack-paypal-button__product-price' )?.innerHTML ?? null;
		const tag = () => document.querySelectorAll( '.jetpack-paypal-button__discount' );
		const chips = () =>
			[ ...document.querySelectorAll( '.jetpack-paypal-button__variant-option' ) ].map(
				option => option.innerHTML
			);

		/**
		 * Check the tag reads `text` and sits right after the headline price.
		 *
		 * @param {string} text - The tag text.
		 */
		const expectTag = text => {
			expect( tag() ).toHaveLength( 1 );
			expect( tag()[ 0 ].innerHTML ).toBe( text );
			expect( document.querySelector( '.jetpack-paypal-button__product-price' ).nextSibling ).toBe(
				tag()[ 0 ]
			);
		};

		it.each( [
			[
				'a percentage',
				block( '1.00', 'PERCENTAGE', '10' ),
				struck( '$1.00', '$0.90' ),
				'10% discount',
			],
			[
				'a price saved as 1',
				block( '1', 'PERCENTAGE', '10' ),
				struck( '$1', '$0.90' ),
				'10% discount',
			],
			[
				'a flat amount',
				block( '10.00', 'FLAT', '2.00' ),
				struck( '$10.00', '$8.00' ),
				'$2.00 discount',
			],
			[
				'yen',
				block( '999', 'PERCENTAGE', '15', { currencyCode: 'JPY' } ),
				struck( '¥999', '¥849' ),
				'15% discount',
			],
		] )(
			'shows the struck price, the discounted price and the tag for %s',
			( _label, attributes, expected, tagText ) => {
				render( preview( attributes ) );

				expect( headline() ).toBe( expected );
				expectTag( tagText );
			}
		);

		it.each( [
			[
				'a percentage',
				block( '', 'PERCENTAGE', '10', options ),
				struck( '$20.00', '$18.00' ),
				[ chip( 'small', '$20.00', '$18.00' ), chip( 'large', '$30.00', '$27.00' ) ],
				'10% discount',
			],
			[
				'a flat amount',
				block( '', 'FLAT', '2.00', options ),
				struck( '$20.00', '$18.00' ),
				[ chip( 'small', '$20.00', '$18.00' ), chip( 'large', '$30.00', '$28.00' ) ],
				'$2.00 discount',
			],
			[
				'a flat amount over the cheapest option',
				block( '', 'FLAT', '25.00', options ),
				struck( '$20.00', '-$5.00' ),
				[ chip( 'small', '$20.00', '-$5.00' ), chip( 'large', '$30.00', '$5.00' ) ],
				'$25.00 discount',
			],
		] )(
			'discounts the From price and each option for %s',
			( _label, attributes, expected, expectedChips, tagText ) => {
				render( preview( attributes ) );

				expect( headline() ).toBe( `From ${ expected }` );
				expect( chips() ).toEqual( expectedChips );
				expectTag( tagText );
			}
		);

		it.each( [
			[
				'a discount turned off with a value saved',
				block( '1.00', 'PERCENTAGE', '10', { discountEnabled: false } ),
			],
			[ 'a blank percentage', block( '10.00', 'PERCENTAGE', '' ) ],
			[ 'a blank flat amount', block( '10.00', 'FLAT', '' ) ],
			[
				'a discount turned off on options',
				block( '', 'PERCENTAGE', '10', { ...options, discountEnabled: false } ),
			],
		] )( 'shows the same card as with no discount for %s', ( _label, attributes ) => {
			const {
				discountEnabled: _enabled,
				discountType: _type,
				discountValue: _value,
				...plain
			} = attributes;
			const { container, rerender } = render( preview( plain ) );
			const expected = container.innerHTML;

			rerender( preview( attributes ) );

			// The card has a price, so the equal-markup check below compares real cards.
			expect( headline() ).toMatch( /^(From )?\$\d+\.00$/ );
			expect( container.innerHTML ).toBe( expected );
		} );

		it( 'discounts the product price when the options are unpriced', () => {
			const variants = {
				dimensions: [
					{
						name: 'size',
						primary: true,
						options: [
							{ label: 'small', unit_amount: { value: '' } },
							{ label: 'large', unit_amount: { value: '' } },
						],
					},
				],
			};
			render(
				preview( block( '10.00', 'PERCENTAGE', '10', { variantsEnabled: true, variants } ) )
			);

			expect( headline() ).toBe( struck( '$10.00', '$9.00' ) );
			expect( chips() ).toEqual( [ 'small', 'large' ] );
			expectTag( '10% discount' );
		} );

		it( 'shows the label alone for an unpriced option', () => {
			const variants = {
				dimensions: [
					{
						name: 'size',
						primary: true,
						options: [
							{ label: 'small', unit_amount: { value: '20.00' } },
							{ label: 'large', unit_amount: { value: '' } },
						],
					},
				],
			};
			render( preview( block( '', 'PERCENTAGE', '10', { variantsEnabled: true, variants } ) ) );

			expect( chips() ).toEqual( [ chip( 'small', '$20.00', '$18.00' ), 'large' ] );
		} );

		it( 'shows just the name for a discount with options off and a blank price', () => {
			render(
				preview( block( '', 'PERCENTAGE', '10', { variantsEnabled: false, variants: sizes } ) )
			);

			expect( screen.getByText( 'Widget' ) ).toBeInTheDocument();
			expect( headline() ).toBeNull();
			expect( tag() ).toHaveLength( 0 );
		} );

		it( 'updates the price, tag and option prices as the discount changes', () => {
			const { rerender } = render( preview( block( '10.00', 'FLAT', '' ) ) );
			expect( headline() ).toBe( '$10.00' );
			expect( tag() ).toHaveLength( 0 );

			rerender( preview( block( '10.00', 'FLAT', '2' ) ) );
			expect( headline() ).toBe( struck( '$10.00', '$8.00' ) );
			expectTag( '$2 discount' );

			rerender( preview( block( '10.00', 'PERCENTAGE', '10' ) ) );
			expect( headline() ).toBe( struck( '$10.00', '$9.00' ) );
			expectTag( '10% discount' );

			rerender( preview( block( '20.00', 'PERCENTAGE', '10' ) ) );
			expect( headline() ).toBe( struck( '$20.00', '$18.00' ) );

			rerender( preview( block( '20.00', 'PERCENTAGE', '10', { discountEnabled: false } ) ) );
			expect( headline() ).toBe( '$20.00' );
			expect( tag() ).toHaveLength( 0 );

			rerender( preview( block( '', 'PERCENTAGE', '10', options ) ) );
			expect( chips() ).toEqual( [
				chip( 'small', '$20.00', '$18.00' ),
				chip( 'large', '$30.00', '$27.00' ),
			] );

			rerender( preview( block( '', 'FLAT', '5.00', options ) ) );
			expect( headline() ).toBe( `From ${ struck( '$20.00', '$15.00' ) }` );
			expect( chips() ).toEqual( [
				chip( 'small', '$20.00', '$15.00' ),
				chip( 'large', '$30.00', '$25.00' ),
			] );
		} );
	} );
} );

// The same cases run against the PHP render in Paypal_Payment_Buttons_Test.
describe( 'product card matches the published page', () => {
	it.each( cardParity.cases.map( c => [ c.name, c ] ) )( '%s', ( _name, testCase ) => {
		render( <PayPalButtonPreview { ...testCase.attributes } attributes={ testCase.attributes } /> );

		const card = document.querySelector( '.jetpack-paypal-button__product' );
		expect( card?.outerHTML ?? null ).toBe( testCase.card );
		// Positive control: the preview itself rendered.
		expect(
			document.querySelector( '.jetpack-paypal-button-preview__checkout-button' )
		).toBeInTheDocument();
	} );
} );
