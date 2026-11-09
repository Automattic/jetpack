import { render, screen } from '@testing-library/react';
import ConnectionGate from '../connection-gate';

const mockUseConnection = jest.fn();
const mockIsSimpleSite = jest.fn();

jest.mock( '@automattic/jetpack-connection/connection-from', () => ( {
	CONNECTION_FROM: { jetpackMonetizeConnectionGate: 'jetpack_monetize_connection_gate' },
} ) );
jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: () => mockUseConnection(),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockIsSimpleSite(),
} ) );

const connected = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

describe( 'ConnectionGate', () => {
	it.each( [
		[ 'a fully connected site and user', false, connected, true ],
		[
			'a user without a WordPress.com account',
			false,
			{ ...connected, isUserConnected: false },
			false,
		],
		[
			'a site whose owner is not connected',
			false,
			{ ...connected, hasConnectedOwner: false },
			true,
		],
		[ 'an unregistered site', false, { ...connected, isRegistered: false }, false ],
		[ 'Simple, which has no Jetpack connection', true, {}, true ],
	] )( 'for %s, shows the content: %p', ( _case, isSimple, connection, showsContent ) => {
		mockIsSimpleSite.mockReturnValue( isSimple );
		mockUseConnection.mockReturnValue( { ...connection, handleRegisterSite: jest.fn() } );

		render(
			<ConnectionGate>
				<p>Payments</p>
			</ConnectionGate>
		);

		expect( Boolean( screen.queryByText( 'Payments' ) ) ).toBe( showsContent );
		expect( Boolean( screen.queryByRole( 'button', { name: 'Connect' } ) ) ).toBe( ! showsContent );
	} );
} );
