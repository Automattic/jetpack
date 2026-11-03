import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockUnlinkUser = jest.fn< ( ...args: unknown[] ) => Promise< unknown > >();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { setApiRoot: jest.fn(), setApiNonce: jest.fn(), unlinkUser: mockUnlinkUser },
} ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

// Own file because the store fixes the viewer when `state/store` is first evaluated.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: { isMaster: false, permissions: { manage_options: false } },
	},
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: DisconnectUserDialog } = await import( '../index' );

describe( 'DisconnectUserDialog, for a non-administrator', () => {
	const testProps = {
		apiNonce: 'test-nonce',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true,
		onClose: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUnlinkUser.mockResolvedValue( undefined );
	} );

	it( 'unlinks without forcing', async () => {
		const user = userEvent.setup();
		render( <DisconnectUserDialog { ...testProps } /> );

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

		expect( mockUnlinkUser ).toHaveBeenCalledWith( false, { disconnectAllUsers: false } );
	} );

	it( 'points at a site admin when unlink fails, having no way to update Jetpack', async () => {
		const user = userEvent.setup();
		mockUnlinkUser.mockRejectedValueOnce( new Error( 'nope' ) );
		render( <DisconnectUserDialog { ...testProps } /> );

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

		await expect(
			screen.findByText( /ask a site admin to update Jetpack/ )
		).resolves.toBeInTheDocument();
	} );
} );
