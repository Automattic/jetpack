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

	it( 'shows one message naming the URL WordPress.com tried for HTTP errors', () => {
		mockRegistrationError = {
			response: {
				code: 'site_inaccessible_403',
				message:
					'The Jetpack server was unable to communicate with your site https://example.com [HTTP 403].',
			},
		};
		render( <ConnectionForm /> );
		expect(
			screen.getByText(
				/Something blocked WordPress.com from verifying your site at https:\/\/example\.com \(HTTP 403\)/,
				{
					selector: 'p',
				}
			)
		).toBeInTheDocument();
		expect( screen.queryByText( /The Jetpack server was unable/ ) ).not.toBeInTheDocument();
	} );

	it( 'shows only the mapped message when the site’s text adds nothing', () => {
		mockRegistrationError = {
			response: { code: 'request_cancelled', message: 'Too many attempts.' },
		};
		render( <ConnectionForm /> );
		expect(
			screen.getByText( /too many connection attempts/, { selector: 'p' } )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Too many attempts.' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the site’s own message instead of the generic text for unmapped codes', () => {
		mockRegistrationError = {
			response: {
				code: 'cannot_save_secrets',
				message: 'Jetpack could not save secrets. Please contact your host.',
			},
		};
		render( <ConnectionForm /> );
		expect(
			screen.getByText( 'Jetpack could not save secrets. Please contact your host.', {
				selector: 'p',
			} )
		).toBeInTheDocument();
		expect( screen.queryByText( 'An error occurred. Please try again.' ) ).not.toBeInTheDocument();
	} );

	it( 'maps failures of the site’s own request by error name', () => {
		mockRegistrationError = { name: 'JsonParseError' };
		render( <ConnectionForm /> );
		expect(
			screen.getByText( /The connection request got an unexpected response/, { selector: 'p' } )
		).toBeInTheDocument();
	} );

	it( 'records the error code as a plain value', () => {
		mockRegistrationError = {
			response: { code: 'request_cancelled', message: 'Too many attempts.' },
		};
		render( <ConnectionForm /> );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_my_jetpack_onboarding_error',
			expect.objectContaining( { error_code: 'request_cancelled' } )
		);
		expect( mockRecordEvent.mock.calls[ 0 ][ 1 ] ).not.toHaveProperty( 'error_message' );
	} );

	it( 'records no_error_code when the error carries no code or name', () => {
		mockRegistrationError = { response: { message: 'Something odd.' } };
		render( <ConnectionForm /> );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_my_jetpack_onboarding_error',
			expect.objectContaining( { error_code: 'no_error_code' } )
		);
	} );
} );
