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
	isConfirming: false,
	autoVerify: jest.fn(),
};

const renderField = ( value = '' ) =>
	render(
		<GoogleVerificationField
			value={ value }
			onChange={ jest.fn() }
			saveCode={ jest.fn< ( code: string ) => Promise< void > >() }
		/>
	);

describe( 'GoogleVerificationField', () => {
	beforeEach( () => {
		mockUseGoogleVerify.mockReturnValue( googleVerifyDefaults );
	} );

	it( 'names its controls as a group', () => {
		renderField();

		// "Google" is styled as a field label (`heading-sm`, 11px uppercase) to match the
		// other four services, but here it heads several controls rather than labelling
		// one input. Without the group it would read as a label attached to nothing.
		const group = screen.getByRole( 'group', { name: 'Google' } );
		expect( group ).toBeInTheDocument();
		expect( screen.getByText( 'Google' ).className ).toMatch( /heading-sm/ );
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

	const manualCode = () => screen.getByRole( 'textbox', { name: /Google verification code/ } );

	it( 'keeps the manual code editable while the popup is open, so a blocked popup leaves a way in', () => {
		mockUseGoogleVerify.mockReturnValue( { ...googleVerifyDefaults, isVerifying: true } );
		renderField( 'google-code' );

		expect( manualCode() ).toBeEnabled();
	} );

	it( 'locks the manual code once the popup returns, so a typed code cannot replace the token', () => {
		mockUseGoogleVerify.mockReturnValue( {
			...googleVerifyDefaults,
			isVerifying: true,
			isConfirming: true,
		} );
		renderField( 'google-code' );

		expect( manualCode() ).toBeDisabled();
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
		rerender(
			<GoogleVerificationField
				value=""
				onChange={ jest.fn() }
				saveCode={ jest.fn< ( code: string ) => Promise< void > >() }
			/>
		);

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
