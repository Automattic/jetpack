import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const mockUseGoogleVerify = jest.fn();

jest.unstable_mockModule( '../../../data/use-google-verify', () => ( {
	useGoogleVerify: mockUseGoogleVerify,
} ) );

const { default: VerificationCard } = await import( '../verification-card' );

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
} );
