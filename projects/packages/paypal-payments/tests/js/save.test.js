/* eslint-disable testing-library/no-container, testing-library/no-node-access */
/**
 * Tests for the PayPal Payment Buttons save component.
 *
 * Verifies that the save function renders the correct frontend markup
 * for API-managed blocks, legacy paste-code blocks, and edge cases.
 *
 * @package
 */

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: {
		save: () => ( { className: 'wp-block-test' } ),
	},
} ) );

import { render, screen } from '@testing-library/react';
import PayPalPaymentButtonsSave from '../../src/paypal-payment-buttons/save';

describe( 'PayPalPaymentButtonsSave', () => {
	it( 'renders an API-managed block with product info and payment link', () => {
		const attributes = {
			isApiManaged: true,
			buttonType: 'stacked',
			paymentLink: 'https://www.paypal.com/ncp/payment/ABC123',
			productName: 'Test Product',
			price: '19.99',
			currencyCode: 'USD',
			productDescription: 'A great product.',
			buttonText: 'Buy Now',
		};

		const { container } = render( <PayPalPaymentButtonsSave attributes={ attributes } /> );

		expect( screen.getByText( 'Test Product' ) ).toBeInTheDocument();
		expect( screen.getByText( 'A great product.' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Buy Now' ) ).toBeInTheDocument();

		// Price renders as "USD 19.99" (currency code + space + value).
		expect( screen.getByText( /USD/ ) ).toBeInTheDocument();

		// Payment link is used as the href.
		const paypalLink = container.querySelector( '.jetpack-paypal-button__paypal-link' );
		expect( paypalLink ).toHaveAttribute( 'href', 'https://www.paypal.com/ncp/payment/ABC123' );
	} );

	it( 'renders a stacked layout with a debit/credit button', () => {
		const attributes = {
			isApiManaged: true,
			buttonType: 'stacked',
			paymentLink: 'https://www.paypal.com/ncp/payment/ABC123',
			productName: 'Widget',
			price: '10.00',
			currencyCode: 'USD',
		};

		const { container } = render( <PayPalPaymentButtonsSave attributes={ attributes } /> );

		const debitLink = container.querySelector( '.jetpack-paypal-button__debit-link' );
		expect( debitLink ).toBeInTheDocument();
		expect( debitLink ).toHaveTextContent( 'Debit or Credit Card' );
	} );

	it( 'renders a single layout without a debit/credit button', () => {
		const attributes = {
			isApiManaged: true,
			buttonType: 'single',
			paymentLink: 'https://www.paypal.com/ncp/payment/ABC123',
			productName: 'Widget',
			price: '10.00',
			currencyCode: 'USD',
		};

		const { container } = render( <PayPalPaymentButtonsSave attributes={ attributes } /> );

		const debitLink = container.querySelector( '.jetpack-paypal-button__debit-link' );
		expect( debitLink ).not.toBeInTheDocument();
	} );

	it( 'renders a legacy block with hostedButtonId', () => {
		const attributes = {
			isApiManaged: false,
			scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
			hostedButtonId: 'HOSTED_BTN_123',
			buttonType: 'stacked',
		};

		const { container } = render( <PayPalPaymentButtonsSave attributes={ attributes } /> );

		const legacyDiv = container.querySelector( '#HOSTED_BTN_123' );
		expect( legacyDiv ).toBeInTheDocument();
		expect( legacyDiv ).toHaveClass( 'jetpack-paypal-button', 'jetpack-paypal-button--stacked' );
	} );

	it( 'renders an empty fallback when no attributes match', () => {
		const attributes = {};

		const { container } = render( <PayPalPaymentButtonsSave attributes={ attributes } /> );

		// Should render only the block wrapper div with no children.
		const wrapper = container.firstChild;
		expect( wrapper ).toHaveClass( 'wp-block-test' );
		expect( wrapper.children ).toHaveLength( 0 );
	} );

	it( 'does not render product description when it is empty', () => {
		const attributes = {
			isApiManaged: true,
			buttonType: 'stacked',
			paymentLink: 'https://www.paypal.com/ncp/payment/ABC123',
			productName: 'Widget',
			price: '5.00',
			currencyCode: 'USD',
			productDescription: '',
		};

		const { container } = render( <PayPalPaymentButtonsSave attributes={ attributes } /> );

		const descriptionEl = container.querySelector( '.jetpack-paypal-button__product-description' );
		expect( descriptionEl ).not.toBeInTheDocument();
	} );
} );
