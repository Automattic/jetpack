import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
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
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	...( jest.requireActual( '@automattic/jetpack-script-data' ) as object ),
	isWoASite: () => false,
} ) );

// Own file because the store fixes the viewer when `state/store` is first evaluated, and
// ./component.tsx seeds the owner.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: { isMaster: false, permissions: { manage_options: false } },
	},
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: ManageConnectionDialog } = await import( '../index' );

describe( 'ManageConnectionDialog, for a non-owner', () => {
	const testProps = {
		apiNonce: 'test-nonce',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true,
		onClose: jest.fn(),
		onUnlinked: jest.fn(),
		connectedUser: {
			currentUser: {
				id: 2,
				username: 'editor',
				isConnected: true,
				isMaster: false,
				permissions: { manage_options: false },
			},
		},
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUnlinkUser.mockResolvedValue( undefined );
	} );

	it( 'confirms before unlinking, then closes the action list behind it', async () => {
		const user = userEvent.setup();
		render( <ManageConnectionDialog { ...testProps } /> );

		await user.click( screen.getByRole( 'link', { name: /Disconnect my user account/ } ) );

		expect(
			screen.getByRole( 'dialog', { name: 'Disconnect your user account' } )
		).toBeInTheDocument();
		expect( mockUnlinkUser ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

		expect( mockUnlinkUser ).toHaveBeenCalledWith( false, { disconnectAllUsers: false } );
		await waitFor( () => expect( testProps.onUnlinked ).toHaveBeenCalledTimes( 1 ) );
		expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
	} );
} );
