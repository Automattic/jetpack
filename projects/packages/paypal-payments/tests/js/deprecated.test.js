/* eslint-disable testing-library/no-container, testing-library/no-node-access */
/**
 * Tests for the PayPal Payment Buttons deprecation handler.
 *
 * Verifies that the v0.4.0-alpha deprecated entry correctly identifies
 * legacy blocks, migrates their attributes, and reproduces the original
 * save markup for block validation.
 *
 * @package
 */

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: {
		save: () => ( { className: 'wp-block-test' } ),
	},
} ) );

import { render } from '@testing-library/react';
import deprecated from '../../src/paypal-payment-buttons/deprecated';

// The deprecated array should have exactly one entry (v040Alpha).
const v040Alpha = deprecated[ 0 ];

describe( 'deprecated — v0.4.0-alpha', () => {
	describe( 'isEligible', () => {
		it( 'returns true for a legacy block with scriptSrc and no isApiManaged', () => {
			const attributes = {
				scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
				hostedButtonId: 'BTN_123',
			};
			expect( v040Alpha.isEligible( attributes ) ).toBe( true );
		} );

		it( 'returns true for a legacy block with only hostedButtonId', () => {
			const attributes = {
				hostedButtonId: 'BTN_123',
			};
			expect( v040Alpha.isEligible( attributes ) ).toBe( true );
		} );

		it( 'returns false for an API-managed block', () => {
			const attributes = {
				isApiManaged: true,
				resourceId: 'RES_456',
				paymentLink: 'https://www.paypal.com/ncp/payment/ABC',
			};
			expect( v040Alpha.isEligible( attributes ) ).toBe( false );
		} );

		it( 'returns false for an empty attributes object', () => {
			const attributes = {};
			expect( v040Alpha.isEligible( attributes ) ).toBe( false );
		} );
	} );

	describe( 'migrate', () => {
		it( 'adds isApiManaged: false to the attributes', () => {
			const oldAttributes = {
				scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
				hostedButtonId: 'BTN_123',
				buttonType: 'stacked',
				buttonText: 'Pay Now',
			};

			const migrated = v040Alpha.migrate( oldAttributes );

			expect( migrated.isApiManaged ).toBe( false );
		} );

		it( 'preserves all existing attributes', () => {
			const oldAttributes = {
				scriptSrc: 'https://www.paypal.com/sdk/js?client-id=test',
				hostedButtonId: 'BTN_123',
				buttonType: 'single',
				buttonText: 'Subscribe',
			};

			const migrated = v040Alpha.migrate( oldAttributes );

			expect( migrated.scriptSrc ).toBe( oldAttributes.scriptSrc );
			expect( migrated.hostedButtonId ).toBe( oldAttributes.hostedButtonId );
			expect( migrated.buttonType ).toBe( 'single' );
			expect( migrated.buttonText ).toBe( 'Subscribe' );
		} );
	} );

	describe( 'save', () => {
		it( 'renders legacy markup with hostedButtonId', () => {
			const attributes = {
				buttonType: 'stacked',
				hostedButtonId: 'BTN_LEGACY',
			};

			const { container } = render( v040Alpha.save( { attributes } ) );

			const legacyDiv = container.querySelector( '#BTN_LEGACY' );
			expect( legacyDiv ).toBeInTheDocument();
			expect( legacyDiv ).toHaveClass( 'jetpack-paypal-button', 'jetpack-paypal-button--stacked' );
		} );

		it( 'renders an empty div when hostedButtonId is missing', () => {
			const attributes = {
				buttonType: 'stacked',
			};

			const { container } = render( v040Alpha.save( { attributes } ) );

			const wrapper = container.firstChild;
			expect( wrapper ).toHaveClass( 'wp-block-test' );
			expect( wrapper.children ).toHaveLength( 0 );
		} );
	} );
} );

describe( 'deprecated array', () => {
	it( 'has exactly one entry', () => {
		expect( deprecated ).toHaveLength( 1 );
	} );
} );
