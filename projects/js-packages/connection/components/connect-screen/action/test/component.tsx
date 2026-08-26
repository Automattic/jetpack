import { render, screen } from '@testing-library/react';
import ConnectScreenAction, { getConnectScreenErrorMessage } from '../index';

describe( 'getConnectScreenErrorMessage', () => {
	it( 'maps private network error codes to a message', () => {
		expect( getConnectScreenErrorMessage( 'siteurl_private_ip' ) ).toBe(
			'Your site host is on a private network. Sites can connect to WordPress.com only on public sites.'
		);
	} );

	it( 'maps a registration HTTP failure to a message about reaching WordPress.com', () => {
		expect( getConnectScreenErrorMessage( 'register_http_request_failed' ) ).toBe(
			'Your site could not reach WordPress.com. This is usually temporary — try again in a minute. If it keeps happening, ask your hosting provider to allow connections to jetpack.wordpress.com.'
		);
	} );

	it( 'maps WordPress.com server errors and timeouts to a message', () => {
		const message = 'WordPress.com is temporarily unavailable. Please try again in a minute.';
		expect( getConnectScreenErrorMessage( 'wpcom_5??' ) ).toBe( message );
		expect( getConnectScreenErrorMessage( 'wpcom_408' ) ).toBe( message );
	} );

	it( 'returns undefined for unknown error codes', () => {
		expect( getConnectScreenErrorMessage( 'some_unknown_code' ) ).toBeUndefined();
		expect( getConnectScreenErrorMessage( undefined ) ).toBeUndefined();
	} );
} );

describe( 'ConnectScreenAction', () => {
	it( 'falls back to a generic message for unknown error codes', () => {
		render(
			<ConnectScreenAction buttonLabel="Set up Jetpack" displayButtonError errorCode="whatever" />
		);
		expect( screen.getByText( 'An error occurred. Please try again.' ) ).toBeInTheDocument();
	} );

	it( 'shows the mapped message for known error codes', () => {
		render(
			<ConnectScreenAction
				buttonLabel="Set up Jetpack"
				displayButtonError
				errorCode="register_http_request_failed"
			/>
		);
		expect( screen.getByText( /Your site could not reach WordPress\.com/ ) ).toBeInTheDocument();
	} );
} );
