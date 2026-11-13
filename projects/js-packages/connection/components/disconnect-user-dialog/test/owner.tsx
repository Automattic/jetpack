import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockUnlinkUser = jest.fn< ( ...args: unknown[] ) => Promise< unknown > >();
const mockRecordEvent = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { setApiRoot: jest.fn(), setApiNonce: jest.fn(), unlinkUser: mockUnlinkUser },
} ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent } },
} ) );

// Own file because the store fixes the viewer when `state/store` is first evaluated.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: { isMaster: true, permissions: { manage_options: true } },
	},
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: DisconnectUserDialog } = await import( '../index' );

describe( 'DisconnectUserDialog, for the connection owner', () => {
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

	it( 'warns about the cascade instead of showing the plain confirm', () => {
		render( <DisconnectUserDialog { ...testProps } /> );

		expect(
			screen.getByRole( 'dialog', { name: 'Disconnect owner account' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'dialog', { name: 'Disconnect your user account' } )
		).not.toBeInTheDocument();
	} );

	it( 'offers the transfer flow as the way out', async () => {
		const user = userEvent.setup();
		const onTransferOwnership = jest.fn();
		render( <DisconnectUserDialog { ...testProps } onTransferOwnership={ onTransferOwnership } /> );

		await user.click( screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } ) );

		expect( onTransferOwnership ).toHaveBeenCalledTimes( 1 );
		expect( mockUnlinkUser ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'reports the transfer click with the host context', 'connectors', 'connectors' ],
		[ 'reports a null context when the host passes none', undefined, null ],
	] )( '%s', async ( _name, context, expectedContext ) => {
		const user = userEvent.setup();
		render(
			<DisconnectUserDialog
				{ ...testProps }
				context={ context }
				onTransferOwnership={ jest.fn() }
			/>
		);

		await user.click( screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } ) );

		const trackedClicks = mockRecordEvent.mock.calls.filter(
			( [ event ] ) => event === 'jetpack_connection_owner_transfer_click'
		);
		expect( trackedClicks ).toHaveLength( 1 );
		expect( trackedClicks[ 0 ][ 1 ] ).toEqual( {
			location: 'owner_disconnect_dialog',
			context: expectedContext,
		} );
	} );

	// The transfer flow is the way out of this warning, so it is the exit most likely to be
	// taken mid-request — and taking it would leave the unlink running behind a dialog the
	// host closes when it lands.
	it( 'closes neither exit while the request is in flight', async () => {
		const user = userEvent.setup();
		const onTransferOwnership = jest.fn();
		// Left pending on purpose: settling it would update state outside act().
		mockUnlinkUser.mockReturnValue( new Promise( () => {} ) );
		render( <DisconnectUserDialog { ...testProps } onTransferOwnership={ onTransferOwnership } /> );

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

		expect( screen.getByRole( 'button', { name: 'Stay connected' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		const transfer = screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } );
		expect( transfer ).toHaveAttribute( 'aria-disabled', 'true' );
		await user.click( transfer );
		expect( onTransferOwnership ).not.toHaveBeenCalled();
		expect( testProps.onClose ).not.toHaveBeenCalled();
	} );

	// Last, and the only test here that completes an unlink: a successful one clears isMaster in
	// the store, so anything owner-shaped after it would render as a non-owner.
	it( 'disconnects every user on confirm, and reports it against its host', async () => {
		const user = userEvent.setup();
		render( <DisconnectUserDialog { ...testProps } context="connectors" /> );

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

		expect( mockUnlinkUser ).toHaveBeenCalledWith( true, { disconnectAllUsers: true } );
		// The owner path records its own events, so the host's context has to reach them too.
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_manage_connection_dialog_owner_disconnect_click',
			{ context: 'connectors' }
		);
		await waitFor( () =>
			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_manage_connection_dialog_owner_disconnect_success',
				{ context: 'connectors' }
			)
		);

		// Success clears isMaster in the store. The dialog the owner opened has to survive that
		// until its host closes or reloads, rather than becoming the non-owner confirm.
		expect(
			screen.getByRole( 'dialog', { name: 'Disconnect owner account' } )
		).toBeInTheDocument();
	} );
} );
