import { render, screen, within } from '@testing-library/react';
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
		expect( screen.queryByText( 'Details' ) ).not.toBeInTheDocument();
	} );

	it( 'shows a collapsed detail behind Details', () => {
		render(
			<ConnectScreenAction
				buttonLabel="Set up Jetpack"
				displayButtonError
				errorCode="site_inaccessible_403"
				errorDisplay={ {
					message: 'Something blocked WordPress.com.',
					detail: 'The Jetpack server was unable to communicate with your site [HTTP 403].',
					detailCollapsed: true,
				} }
			/>
		);
		expect( screen.getByText( 'Details' ) ).toBeInTheDocument();
		expect( within( screen.getByRole( 'group' ) ).getByText( /\[HTTP 403\]/ ) ).toBeInTheDocument();
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
