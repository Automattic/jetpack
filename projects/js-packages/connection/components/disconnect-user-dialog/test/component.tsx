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
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

// The store reads its initial state when `state/store` is first evaluated, so the viewer cannot
// change within a file. The other viewers have their own: ./owner.tsx and ./non-admin.tsx.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: { isMaster: false, permissions: { manage_options: true } },
	},
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: DisconnectUserDialog } = await import( '../index' );

describe( 'DisconnectUserDialog', () => {
	const testProps = {
		apiNonce: 'test-nonce',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true, // nothing renders if false
		onClose: jest.fn(),
	};

	const dialogName = 'Disconnect your user account';

	beforeEach( () => {
		jest.clearAllMocks();
		mockUnlinkUser.mockResolvedValue( undefined );
	} );

	it( 'renders nothing when isOpen is false', () => {
		render( <DisconnectUserDialog { ...testProps } isOpen={ false } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the labelled Modal', () => {
		render( <DisconnectUserDialog { ...testProps } /> );
		expect( screen.getByRole( 'dialog', { name: dialogName } ) ).toBeInTheDocument();
	} );

	it( 'calls onClose when Cancel is clicked, without unlinking', async () => {
		const user = userEvent.setup();
		render( <DisconnectUserDialog { ...testProps } /> );

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
		expect( mockUnlinkUser ).not.toHaveBeenCalled();
	} );

	it( 'unlinks and reports the outcome without closing itself', async () => {
		const user = userEvent.setup();
		const onUnlinked = jest.fn();
		render( <DisconnectUserDialog { ...testProps } onUnlinked={ onUnlinked } /> );

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

		expect( mockUnlinkUser ).toHaveBeenCalledWith( true );
		await waitFor( () => expect( onUnlinked ).toHaveBeenCalledTimes( 1 ) );
		expect( testProps.onClose ).not.toHaveBeenCalled();
	} );

	it( 'shows the admin-oriented error and re-enables the button when unlink fails', async () => {
		const user = userEvent.setup();
		mockUnlinkUser.mockRejectedValueOnce( new Error( 'nope' ) );
		render( <DisconnectUserDialog { ...testProps } /> );

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

		await expect(
			screen.findByText( /make sure all Jetpack plugins are updated/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toBeEnabled();
	} );
} );
