import { render, screen } from '@testing-library/react';
import ConnectScreenAction from '../index';

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
		expect( screen.getByText( /Your site couldn’t reach WordPress\.com/ ) ).toBeInTheDocument();
	} );

	it( 'shows the site’s explanation under the mapped message', () => {
		render(
			<ConnectScreenAction
				buttonLabel="Set up Jetpack"
				displayButtonError
				errorCode="register_http_request_failed"
				errorDescription="cURL error 6: Could not resolve host."
			/>
		);
		expect( screen.getByText( /Your site couldn’t reach WordPress\.com/ ) ).toBeInTheDocument();
		expect( screen.getByText( 'cURL error 6: Could not resolve host.' ) ).toBeInTheDocument();
	} );
} );
