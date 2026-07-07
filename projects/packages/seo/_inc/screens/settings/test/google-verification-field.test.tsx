import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const mockUseGoogleVerify = jest.fn();

jest.unstable_mockModule( '../../../data/use-google-verify', () => ( {
	useGoogleVerify: mockUseGoogleVerify,
} ) );

const { default: GoogleVerificationField } = await import( '../google-verification-field' );

const googleVerifyDefaults = {
	state: 'unverified',
	isConnected: true,
	isOwner: false,
	searchConsoleUrl: '',
	isVerifying: false,
	autoVerify: jest.fn(),
};

const renderField = ( value = '' ) =>
	render( <GoogleVerificationField value={ value } onChange={ jest.fn() } /> );

describe( 'GoogleVerificationField', () => {
	beforeEach( () => {
		mockUseGoogleVerify.mockReturnValue( googleVerifyDefaults );
	} );

	it( 'shows the manual field, but not the manual button, when a value exists', () => {
		renderField( 'google-code' );

		expect( screen.getByRole( 'textbox', { name: /Google verification code/ } ) ).toHaveValue(
			'google-code'
		);
		expect(
			screen.queryByRole( 'button', { name: /Enter a code manually/ } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Verify with Google/ } ) ).toBeInTheDocument();
	} );

	it( 'reveals the manual field and removes the manual button', () => {
		renderField();

		const manualButton = screen.getByRole( 'button', { name: /Enter a code manually/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep for a single click.
		fireEvent.click( manualButton );

		expect(
			screen.getByRole( 'textbox', { name: /Google verification code/ } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Enter a code manually/ } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the manual field mounted when its value is cleared', () => {
		const { rerender } = renderField( 'google-code' );

		// Simulate the controlled parent clearing the value mid-edit.
		rerender( <GoogleVerificationField value="" onChange={ jest.fn() } /> );

		expect(
			screen.getByRole( 'textbox', { name: /Google verification code/ } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Enter a code manually/ } )
		).not.toBeInTheDocument();
	} );

	it( 'shows only the verified state when verified', () => {
		mockUseGoogleVerify.mockReturnValue( { ...googleVerifyDefaults, state: 'verified' } );

		renderField();

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Verified' ) ).toBeInTheDocument();
	} );
} );
