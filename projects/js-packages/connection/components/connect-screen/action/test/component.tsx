import { render, screen } from '@testing-library/react';
import ConnectScreenAction from '../index';

describe( 'ConnectScreenAction', () => {
	it( 'falls back to a generic message for unknown error codes', () => {
		render(
			<ConnectScreenAction buttonLabel="Set up Jetpack" displayButtonError errorCode="whatever" />
		);
		expect( screen.getByText( 'An error occurred. Please try again.' ) ).toBeInTheDocument();
	} );

	it( 'shows the detail under the message', () => {
		render(
			<ConnectScreenAction
				buttonLabel="Set up Jetpack"
				displayButtonError
				errorCode="register_http_request_failed"
				errorDisplay={ {
					message: 'Your site couldn’t reach WordPress.com.',
					detail: 'cURL error 6: Could not resolve host.',
				} }
			/>
		);
		expect( screen.getByText( /Your site couldn’t reach WordPress\.com/ ) ).toBeInTheDocument();
		expect( screen.getByText( 'cURL error 6: Could not resolve host.' ) ).toBeInTheDocument();
	} );

	it( 'shows the site’s own message for an unmapped code', () => {
		render(
			<ConnectScreenAction
				buttonLabel="Set up Jetpack"
				displayButtonError
				errorCode="cannot_save_secrets"
				errorDisplay={ { message: 'Please contact your host.' } }
			/>
		);
		expect( screen.getByText( 'Please contact your host.' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'An error occurred. Please try again.' ) ).not.toBeInTheDocument();
	} );

	it( 'announces a registration error as an alert', () => {
		render(
			<ConnectScreenAction
				buttonLabel="Set up Jetpack"
				displayButtonError
				errorCode="register_http_request_failed"
			/>
		);
		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			/Your site couldn’t reach WordPress\.com/
		);
	} );

	it( 'does not announce the offline mode notice shown on load', () => {
		render( <ConnectScreenAction buttonLabel="Set up Jetpack" isOfflineMode /> );
		expect( screen.getByText( /Offline Mode/ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );
} );
