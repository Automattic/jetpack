import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockUnlinkUser = jest.fn< ( ...args: unknown[] ) => Promise< unknown > >();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: jest.fn(),
		setApiNonce: jest.fn(),
		unlinkUser: mockUnlinkUser,
		fetchConnectionOwnerCandidates: () => Promise.resolve( [] ),
	},
} ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	...( jest.requireActual( '@automattic/jetpack-script-data' ) as object ),
	isWoASite: () => false,
} ) );

// Own file, not a case in ./component.tsx: the store is module state, and a transfer there
// dispatches SET_CONNECTION_OWNER, whose reducer clears isMaster for the rest of the file.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: { isMaster: true, permissions: { manage_options: true } },
	},
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: ManageConnectionDialog } = await import( '../index' );

describe( 'ManageConnectionDialog, for the connection owner', () => {
	const testProps = {
		apiNonce: 'test-nonce',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true,
		onClose: jest.fn(),
		onUnlinked: jest.fn(),
		connectedUser: {
			currentUser: {
				id: 1,
				username: 'admin',
				isConnected: true,
				isMaster: true,
				permissions: { manage_options: true },
			},
		},
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUnlinkUser.mockResolvedValue( undefined );
	} );

	it( 'warns about the cascade rather than unlinking', async () => {
		const user = userEvent.setup();
		render( <ManageConnectionDialog { ...testProps } /> );

		await user.click( screen.getByRole( 'link', { name: /Disconnect my user account/ } ) );

		expect(
			screen.getByRole( 'dialog', { name: 'Disconnect owner account' } )
		).toBeInTheDocument();
		expect( mockUnlinkUser ).not.toHaveBeenCalled();
	} );

	it( 'hands the owner to the transfer flow from inside the warning', async () => {
		const user = userEvent.setup();
		render( <ManageConnectionDialog { ...testProps } /> );

		await user.click( screen.getByRole( 'link', { name: /Disconnect my user account/ } ) );
		await user.click( screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } ) );

		// One dialog, on the transfer view: the warning is gone rather than stacked behind it.
		expect( screen.getAllByRole( 'dialog' ) ).toHaveLength( 1 );
		expect(
			screen.getByRole( 'dialog', { name: 'Transfer connection ownership' } )
		).toBeInTheDocument();
	} );
} );
