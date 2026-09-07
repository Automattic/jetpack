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
		expect( screen.getByText( /Your site could not reach WordPress\.com/ ) ).toBeInTheDocument();
	} );
} );
