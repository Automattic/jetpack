import { render, screen } from '@testing-library/react';
import ConnectionGate from '../connection-gate';

const mockUseConnection = jest.fn();
const mockIsSimpleSite = jest.fn();

jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: () => mockUseConnection(),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( { admin_url: 'https://example.com/wp-admin/' } ),
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
		[ 'a site with no connected owner', false, { ...connected, hasConnectedOwner: false }, false ],
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
