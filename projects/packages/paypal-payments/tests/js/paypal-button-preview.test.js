/* eslint-disable testing-library/no-node-access */
/**
 * Tests for the PayPal Button Preview component.
 *
 * Verifies the editor preview renders product information, button text,
 * layout variants, and prevents click navigation correctly.
 *
 * @package
 */

jest.mock( '@wordpress/i18n', () => ( {
	__: str => str,
} ) );

import { render, screen } from '@testing-library/react';
import PayPalButtonPreview from '../../src/paypal-payment-buttons/paypal-button-preview';

const defaultProps = {
	buttonText: '',
	buttonType: 'stacked',
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

	it( 'shows "Pay Now" as the default button text', () => {
		render( <PayPalButtonPreview { ...defaultProps } buttonText="" /> );
		expect( screen.getByText( 'Pay Now' ) ).toBeInTheDocument();
	} );

	it( 'shows custom button text when provided', () => {
		render( <PayPalButtonPreview { ...defaultProps } buttonText="Buy It Now" /> );
		expect( screen.getByText( 'Buy It Now' ) ).toBeInTheDocument();
	} );

	it( 'shows the debit/credit button for stacked layout', () => {
		render( <PayPalButtonPreview { ...defaultProps } buttonType="stacked" /> );
		expect( screen.getByText( 'Debit or Credit Card' ) ).toBeInTheDocument();
	} );

	it( 'hides the debit/credit button for single layout', () => {
		render( <PayPalButtonPreview { ...defaultProps } buttonType="single" /> );
		expect( screen.queryByText( 'Debit or Credit Card' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the payment link reference', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		expect( screen.getByText( 'Payment link:' ) ).toBeInTheDocument();
		expect( screen.getByText( 'https://www.paypal.com/ncp/payment/ABC123' ) ).toBeInTheDocument();
	} );

	it( 'renders non-interactive preview buttons as div elements', () => {
		render( <PayPalButtonPreview { ...defaultProps } /> );
		const button = document.querySelector( '.jetpack-paypal-button-preview__paypal-button' );
		expect( button ).toBeInTheDocument();
		// Preview buttons are divs (not links) — non-interactive in the editor.
		expect( button.tagName ).toBe( 'DIV' );
		expect( button ).toHaveAttribute( 'aria-hidden', 'true' );
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
} );
