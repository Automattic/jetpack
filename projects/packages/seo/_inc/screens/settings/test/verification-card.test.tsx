import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const mockUseGoogleVerify = jest.fn();

jest.unstable_mockModule( '../../../data/use-google-verify', () => ( {
	useGoogleVerify: mockUseGoogleVerify,
} ) );

const { default: VerificationCard } = await import( '../verification-card' );

const EMPTY = { google: '', bing: '', pinterest: '', yandex: '', facebook: '' };

describe( 'VerificationCard', () => {
	beforeEach( () => {
		mockUseGoogleVerify.mockReturnValue( {
			state: 'unverified',
			isConnected: true,
			isOwner: false,
			searchConsoleUrl: '',
			isVerifying: false,
			autoVerify: jest.fn(),
		} );
	} );

	it( 'retains saved codes but disables editing and Google verification while inactive', () => {
		render(
			<VerificationCard
				value={ {
					google: 'google-code',
					bing: 'bing-code',
					pinterest: 'pinterest-code',
					yandex: 'yandex-code',
					facebook: 'facebook-code',
				} }
				active={ false }
				onToggle={ jest.fn() }
				onChange={ jest.fn() }
				open
				onOpenChange={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'checkbox', { name: /Enable site verification/ } ) ).toBeEnabled();
		expect( screen.getByRole( 'button', { name: /Verify with Google/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'textbox', { name: /Google verification code/ } ) ).toHaveValue(
			'google-code'
		);
		screen.getAllByRole( 'textbox' ).forEach( input => expect( input ).toBeDisabled() );
	} );
	it( 'hides the module toggle where the site cannot switch Jetpack modules', () => {
		// No `onToggle`: the caller omits it on WordPress.com Simple, which has no
		// Jetpack modules and reports them all active — a toggle there would refuse
		// the write and snap back. The codes themselves stay editable.
		render(
			<VerificationCard
				value={ { ...EMPTY, bing: 'bing-code' } }
				active
				onChange={ jest.fn() }
				open
				onOpenChange={ jest.fn() }
			/>
		);

		expect(
			screen.queryByRole( 'checkbox', { name: /Enable site verification/ } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'textbox', { name: /Bing/ } ) ).toBeEnabled();
	} );
} );
