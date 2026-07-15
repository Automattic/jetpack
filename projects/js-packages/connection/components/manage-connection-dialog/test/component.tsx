import { jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockUnlinkUser = jest.fn< () => Promise< unknown > >();
const mockDisconnectSite = jest.fn();
const mockSetApiRoot = jest.fn();
const mockSetApiNonce = jest.fn();
const mockRecordEvent = jest.fn();
const mockIsWoASite = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: mockSetApiRoot,
		setApiNonce: mockSetApiNonce,
		unlinkUser: mockUnlinkUser,
		disconnectSite: mockDisconnectSite,
	},
} ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent }, initialize: jest.fn() },
} ) );

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	...( jest.requireActual( '@automattic/jetpack-script-data' ) as object ),
	isWoASite: mockIsWoASite,
} ) );

const { default: ManageConnectionDialog } = await import( '../index' );

describe( 'ManageConnectionDialog', () => {
	const adminOwnerUser = {
		currentUser: {
			id: 1,
			username: 'admin',
			isConnected: true,
			isMaster: true,
			permissions: { manage_options: true },
		},
	};

	const testProps = {
		apiNonce: 'test-nonce',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true, // nothing renders if false
		onClose: jest.fn(),
		onUnlinked: jest.fn(),
		connectedUser: adminOwnerUser,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockIsWoASite.mockReturnValue( false );
		mockUnlinkUser.mockResolvedValue( undefined );
	} );

	it( 'renders nothing when isOpen is false', () => {
		render( <ManageConnectionDialog { ...testProps } isOpen={ false } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the labelled Modal when open', () => {
		render( <ManageConnectionDialog { ...testProps } /> );
		expect(
			screen.getByRole( 'dialog', { name: 'Manage your Jetpack connection' } )
		).toBeInTheDocument();
	} );

	it( 'calls onClose when "Cancel" is clicked', async () => {
		const user = userEvent.setup();
		render( <ManageConnectionDialog { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'action visibility', () => {
		it( 'shows all three actions for an admin connection owner (not WoA)', () => {
			render( <ManageConnectionDialog { ...testProps } /> );
			expect(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'link', { name: /Disconnect my user account/ } )
			).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: /Disconnect Jetpack/ } ) ).toBeInTheDocument();
		} );

		it( 'hides "Disconnect Jetpack" on a WoA site even for an admin', () => {
			mockIsWoASite.mockReturnValue( true );
			render( <ManageConnectionDialog { ...testProps } /> );
			expect(
				screen.queryByRole( 'link', { name: /Disconnect Jetpack/ } )
			).not.toBeInTheDocument();
		} );

		it( 'hides admin-only actions for a non-admin connected user', () => {
			render(
				<ManageConnectionDialog
					{ ...testProps }
					connectedUser={ {
						currentUser: {
							id: 2,
							username: 'subscriber',
							isConnected: true,
							isMaster: false,
							permissions: { manage_options: false },
						},
					} }
				/>
			);
			expect(
				screen.queryByRole( 'link', { name: /Transfer ownership to another admin/ } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'link', { name: /Disconnect Jetpack/ } )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'link', { name: /Disconnect my user account/ } )
			).toBeInTheDocument();
		} );

		it( 'hides "Disconnect my user account" when the current user is not connected', () => {
			render(
				<ManageConnectionDialog
					{ ...testProps }
					connectedUser={ {
						currentUser: {
							id: 1,
							username: 'admin',
							isConnected: false,
							isMaster: true,
							permissions: { manage_options: true },
						},
					} }
				/>
			);
			expect(
				screen.queryByRole( 'link', { name: /Disconnect my user account/ } )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'disconnecting the user account', () => {
		it( 'opens the owner-disconnect warning dialog instead of unlinking, when user is the connection owner', async () => {
			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );
			await user.click( screen.getByRole( 'link', { name: /Disconnect my user account/ } ) );
			expect(
				screen.getByRole( 'dialog', { name: 'Disconnect Owner Account' } )
			).toBeInTheDocument();
			expect( mockUnlinkUser ).not.toHaveBeenCalled();
		} );

		it( 'unlinks directly and closes, when a non-owner disconnects', async () => {
			const user = userEvent.setup();
			const nonOwner = {
				currentUser: {
					id: 2,
					username: 'editor',
					isConnected: true,
					isMaster: false,
					permissions: { manage_options: false },
				},
			};
			render( <ManageConnectionDialog { ...testProps } connectedUser={ nonOwner } /> );

			await user.click( screen.getByRole( 'link', { name: /Disconnect my user account/ } ) );

			expect( mockUnlinkUser ).toHaveBeenCalledWith( false );
			await waitFor( () => expect( testProps.onUnlinked ).toHaveBeenCalledTimes( 1 ) );
			expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'shows the admin-oriented error message when an admin fails to unlink', async () => {
			const user = userEvent.setup();
			mockUnlinkUser.mockRejectedValueOnce( new Error( 'nope' ) );
			const nonMasterAdmin = {
				currentUser: {
					id: 3,
					username: 'admin2',
					isConnected: true,
					isMaster: false,
					permissions: { manage_options: true },
				},
			};
			render( <ManageConnectionDialog { ...testProps } connectedUser={ nonMasterAdmin } /> );

			await user.click( screen.getByRole( 'link', { name: /Disconnect my user account/ } ) );

			const dialog = screen.getByRole( 'dialog' );
			await expect(
				within( dialog ).findByText(
					/your Jetpack plugin\(s\) may be outdated. Please visit your plugins page/
				)
			).resolves.toBeInTheDocument();
		} );

		it( 'shows the non-admin-oriented error message when a non-admin fails to unlink', async () => {
			const user = userEvent.setup();
			mockUnlinkUser.mockRejectedValueOnce( new Error( 'nope' ) );
			const nonAdmin = {
				currentUser: {
					id: 4,
					username: 'subscriber',
					isConnected: true,
					isMaster: false,
					permissions: { manage_options: false },
				},
			};
			render( <ManageConnectionDialog { ...testProps } connectedUser={ nonAdmin } /> );

			await user.click( screen.getByRole( 'link', { name: /Disconnect my user account/ } ) );

			const dialog = screen.getByRole( 'dialog' );
			await expect(
				within( dialog ).findByText( /Please ask a site admin to update Jetpack/ )
			).resolves.toBeInTheDocument();
		} );
	} );

	describe( 'opening the disconnect-Jetpack sub-dialog', () => {
		it( 'opens the DisconnectDialog when "Disconnect Jetpack" is clicked', async () => {
			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );
			await user.click( screen.getByRole( 'link', { name: /Disconnect Jetpack/ } ) );
			expect(
				screen.getByRole( 'dialog', { name: 'Are you sure you want to disconnect?' } )
			).toBeInTheDocument();
		} );
	} );
} );
