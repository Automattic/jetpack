/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react';

// Mock TextWithFlag component
const mockTextWithFlag = jest.fn( ( { countryCode, children } ) => (
	<span>
		{ countryCode && (
			<span data-testid="flag" data-country={ countryCode }>
				Flag: { countryCode }
			</span>
		) }
		{ children }
	</span>
) );

await jest.unstable_mockModule(
	'../../../../../../src/dashboard/components/text-with-flag/index.tsx',
	() => ( {
		__esModule: true,
		default: mockTextWithFlag,
	} )
);

// Mock libphonenumber-js
const mockParsePhoneNumber = jest.fn();

await jest.unstable_mockModule( 'libphonenumber-js/min/es6', () => ( {
	__esModule: true,
	parsePhoneNumber: mockParsePhoneNumber,
} ) );

// Import component after mocks are set up
const { default: FieldPhone } = await import(
	'../../../../../../src/dashboard/components/inspector/response-fields/field-phone/index.tsx'
);

describe( 'FieldPhone', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Initial render', () => {
		it( 'renders raw phone number immediately before async load completes', () => {
			// Make parsePhoneNumber hang (never resolve) to test initial state
			mockParsePhoneNumber.mockReturnValue( null );

			render( <FieldPhone phone="+14155551234" /> );

			const link = screen.getByRole( 'link' );
			expect( link ).toHaveAttribute( 'href', 'tel:+14155551234' );
			expect( link ).toHaveTextContent( '+14155551234' );
		} );

		it( 'renders tel: link with correct href', () => {
			mockParsePhoneNumber.mockReturnValue( null );

			render( <FieldPhone phone="+14155551234" /> );

			const link = screen.getByRole( 'link' );
			expect( link ).toHaveAttribute( 'href', 'tel:+14155551234' );
		} );
	} );

	describe( 'Formatted display after async load', () => {
		it( 'displays formatted international number after parsing', async () => {
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+1 415 555 1234',
				country: 'US',
			} );

			render( <FieldPhone phone="+14155551234" /> );

			await waitFor( () => {
				const link = screen.getByRole( 'link' );
				expect( link ).toHaveTextContent( '+1 415 555 1234' );
			} );
		} );

		it( 'displays Flag component with correct country code', async () => {
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+1 415 555 1234',
				country: 'US',
			} );

			render( <FieldPhone phone="+14155551234" /> );

			await waitFor( () => {
				const flag = screen.getByTestId( 'flag' );
				expect( flag ).toHaveAttribute( 'data-country', 'US' );
			} );
		} );

		it( 'does not display Flag when country cannot be determined', async () => {
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+14155551234',
				country: undefined,
			} );

			render( <FieldPhone phone="+14155551234" /> );

			await waitFor( () => {
				const link = screen.getByRole( 'link' );
				expect( link ).toHaveTextContent( '+14155551234' );
			} );

			expect( screen.queryByTestId( 'flag' ) ).not.toBeInTheDocument();
		} );

		it( 'keeps tel: href as raw phone value even when formatted', async () => {
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+1 415 555 1234',
				country: 'US',
			} );

			render( <FieldPhone phone="+14155551234" /> );

			const link = await screen.findByRole( 'link' );
			await waitFor( () => {
				expect( link ).toHaveTextContent( '+1 415 555 1234' );
			} );
			await waitFor( () => {
				expect( link ).toHaveAttribute( 'href', 'tel:+14155551234' );
			} );
		} );
	} );

	describe( 'Failed parsing', () => {
		it( 'displays raw phone number when parsing returns null', async () => {
			mockParsePhoneNumber.mockReturnValue( null );

			render( <FieldPhone phone="invalid-phone" /> );

			// Wait a tick for the effect to run
			await act( async () => {
				await new Promise( resolve => setTimeout( resolve, 0 ) );
			} );

			const link = screen.getByRole( 'link' );
			expect( link ).toHaveTextContent( 'invalid-phone' );
			expect( link ).toHaveAttribute( 'href', 'tel:invalid-phone' );
		} );

		it( 'displays raw phone number when parsing throws', async () => {
			mockParsePhoneNumber.mockImplementation( () => {
				throw new Error( 'Invalid phone' );
			} );

			render( <FieldPhone phone="not-a-phone" /> );

			// Wait a tick for the effect to run
			await act( async () => {
				await new Promise( resolve => setTimeout( resolve, 0 ) );
			} );

			const link = screen.getByRole( 'link' );
			expect( link ).toHaveTextContent( 'not-a-phone' );
			expect( link ).toHaveAttribute( 'href', 'tel:not-a-phone' );
		} );
	} );

	describe( 'Phone prop changes', () => {
		it( 'resets display when phone prop changes to unparseable value', async () => {
			// First render with valid phone
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+1 415 555 1234',
				country: 'US',
			} );

			const { rerender } = render( <FieldPhone phone="+14155551234" /> );

			await waitFor( () => {
				expect( screen.getByRole( 'link' ) ).toHaveTextContent( '+1 415 555 1234' );
				expect( screen.getByTestId( 'flag' ) ).toBeInTheDocument();
			} );

			// Change to unparseable phone
			mockParsePhoneNumber.mockReturnValue( null );

			rerender( <FieldPhone phone="12345" /> );

			const link = await screen.findByRole( 'link' );
			// Should immediately show new raw phone, not old formatted one
			await waitFor( () => {
				expect( link ).toHaveTextContent( '12345' );
			} );
			await waitFor( () => {
				expect( link ).toHaveAttribute( 'href', 'tel:12345' );
			} );

			// Flag should be gone
			expect( screen.queryByTestId( 'flag' ) ).not.toBeInTheDocument();
		} );

		it( 'updates display when phone prop changes to different valid number', async () => {
			// First render with US phone
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+1 415 555 1234',
				country: 'US',
			} );

			const { rerender } = render( <FieldPhone phone="+14155551234" /> );

			await waitFor( () => {
				expect( screen.getByRole( 'link' ) ).toHaveTextContent( '+1 415 555 1234' );
				expect( screen.getByTestId( 'flag' ) ).toHaveAttribute( 'data-country', 'US' );
			} );

			// Change to UK phone
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+44 20 7946 0958',
				country: 'GB',
			} );

			rerender( <FieldPhone phone="+442079460958" /> );

			const link = await screen.findByRole( 'link' );
			await waitFor( () => {
				expect( link ).toHaveTextContent( '+44 20 7946 0958' );
				expect( screen.getByTestId( 'flag' ) ).toHaveAttribute( 'data-country', 'GB' );
			} );
			await waitFor( () => {
				expect( link ).toHaveAttribute( 'href', 'tel:+442079460958' );
			} );
		} );
	} );

	describe( 'Various phone formats', () => {
		it( 'handles phone numbers with country code', async () => {
			mockParsePhoneNumber.mockReturnValue( {
				formatInternational: () => '+33 1 23 45 67 89',
				country: 'FR',
			} );

			render( <FieldPhone phone="+33123456789" /> );

			await waitFor( () => {
				expect( screen.getByRole( 'link' ) ).toHaveTextContent( '+33 1 23 45 67 89' );
				expect( screen.getByTestId( 'flag' ) ).toHaveAttribute( 'data-country', 'FR' );
			} );
		} );

		it( 'handles local phone numbers without formatting', async () => {
			mockParsePhoneNumber.mockReturnValue( null );

			render( <FieldPhone phone="555-1234" /> );

			await act( async () => {
				await new Promise( resolve => setTimeout( resolve, 0 ) );
			} );

			const link = screen.getByRole( 'link' );
			expect( link ).toHaveTextContent( '555-1234' );
			expect( link ).toHaveAttribute( 'href', 'tel:555-1234' );
		} );
	} );
} );
