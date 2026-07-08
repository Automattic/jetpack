import useConnection from '@automattic/jetpack-connection/use-connection';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import ConnectionGate from '../connection-gate';

jest.mock( '@automattic/jetpack-connection/use-connection', () => jest.fn() );
jest.mock( '../../../utils', () => ( { assetUrl: ( f: string ) => `assets/${ f }` } ) );

describe( 'ConnectionGate', () => {
	it( 'calls handleRegisterSite when the CTA is clicked', async () => {
		const handleRegisterSite = jest.fn();
		( useConnection as jest.Mock ).mockReturnValue( {
			handleRegisterSite,
			siteIsRegistering: false,
			userIsConnecting: false,
			registrationError: null,
		} );

		const user = userEvent.setup();
		render( <ConnectionGate /> );
		await user.click( screen.getByRole( 'button', { name: /get started/i } ) );
		expect( handleRegisterSite ).toHaveBeenCalled();
	} );

	it( 'shows an error message on registration error', () => {
		( useConnection as jest.Mock ).mockReturnValue( {
			handleRegisterSite: jest.fn(),
			siteIsRegistering: false,
			userIsConnecting: false,
			registrationError: true,
		} );

		render( <ConnectionGate /> );
		expect( screen.getByText( /an error occurred/i ) ).toBeInTheDocument();
	} );
} );
