import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ConnectionForm from '../connection-form';

let mockRegistrationError: unknown = false;
jest.mock( '@automattic/jetpack-connection', () => {
	const actual = jest.requireActual( '@automattic/jetpack-connection' );

	return {
		...actual,
		useConnection: () => ( {
			userIsConnecting: false,
			siteIsRegistering: false,
			handleRegisterSite: jest.fn(),
			registrationError: mockRegistrationError,
		} ),
	};
} );

const mockRecordEvent = jest.fn();
jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );

describe( 'ConnectionForm', () => {
	beforeEach( () => {
		mockRegistrationError = false;
		mockRecordEvent.mockClear();
	} );

	it( 'shows no error before a registration attempt fails', () => {
		render( <ConnectionForm /> );
		expect( screen.queryByText( /An error occurred/ ) ).not.toBeInTheDocument();
	} );

	it( 'shows the mapped message with the site’s own description underneath', () => {
		mockRegistrationError = {
			response: {
				code: 'site_inaccessible_403',
				message: 'The Jetpack server was unable to communicate with your site [HTTP 403].',
			},
		};
		render( <ConnectionForm /> );
		expect(
			screen.getByText( /Something blocked WordPress.com/, { selector: 'p' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'The Jetpack server was unable to communicate with your site [HTTP 403].', {
				selector: 'p',
			} )
		).toBeInTheDocument();
	} );

	it( 'keeps the site’s own message under the generic text for unmapped codes', () => {
		mockRegistrationError = {
			response: {
				code: 'cannot_save_secrets',
				message: 'Jetpack could not save secrets. Please contact your host.',
			},
		};
		render( <ConnectionForm /> );
		expect(
			screen.getByText( 'An error occurred. Please try again.', { selector: 'p' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Jetpack could not save secrets. Please contact your host.', {
				selector: 'p',
			} )
		).toBeInTheDocument();
	} );

	it( 'maps failures of the site’s own request by error name', () => {
		mockRegistrationError = { name: 'JsonParseError' };
		render( <ConnectionForm /> );
		expect(
			screen.getByText( /Your site sent an unexpected response/, { selector: 'p' } )
		).toBeInTheDocument();
	} );

	it( 'records the error code and message as plain values', () => {
		mockRegistrationError = {
			response: { code: 'request_cancelled', message: 'Too many attempts.' },
		};
		render( <ConnectionForm /> );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_my_jetpack_onboarding_error',
			expect.objectContaining( {
				error_code: 'request_cancelled',
				error_message: 'Too many attempts.',
			} )
		);
	} );
} );
