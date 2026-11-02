import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockUnlinkUser = jest.fn< () => Promise< unknown > >();
const mockDisconnectSite = jest.fn();
const mockSetApiRoot = jest.fn();
const mockSetApiNonce = jest.fn();
const mockRecordEvent = jest.fn();
const mockIsWoASite = jest.fn();
const mockSetConnectionOwner = jest.fn< ( id: number ) => Promise< unknown > >();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: mockSetApiRoot,
		setApiNonce: mockSetApiNonce,
		unlinkUser: mockUnlinkUser,
		fetchConnectionOwnerCandidates: () =>
			Promise.resolve( [
				{
					id: 7,
					login: 'kazz',
					displayName: 'Kazz',
					email: 'kazz@example.com',
				},
			] ),
		setConnectionOwner: mockSetConnectionOwner,
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
		mockSetConnectionOwner.mockResolvedValue( { code: 'success' } );
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

		it( 'shows the owner chooser in the dialog it already has, not a second one', async () => {
			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );

			const transfer = screen.getByRole( 'link', {
				name: /Transfer ownership to another admin/,
			} );
			expect( transfer ).not.toHaveAttribute( 'target', '_blank' );

			await user.click( transfer );
			await expect(
				screen.findByRole( 'combobox', { name: /New connection owner/ } )
			).resolves.toBeInTheDocument();

			// One dialog, renamed — a second modal would mean two focus traps.
			expect( screen.getAllByRole( 'dialog' ) ).toHaveLength( 1 );
			expect(
				screen.getByRole( 'dialog', { name: 'Transfer connection ownership' } )
			).toBeInTheDocument();
			// The actions behind are gone rather than sitting under an overlay.
			expect(
				screen.queryByRole( 'link', { name: /Disconnect Jetpack/ } )
			).not.toBeInTheDocument();
		} );

		// Leaving mid-request would not cancel it: the transfer still lands, and its
		// refusal would never be seen.
		it( 'holds the exit shut while the transfer is in flight', async () => {
			let settle: ( value: unknown ) => void = () => {};
			mockSetConnectionOwner.mockReturnValue(
				new Promise( resolve => {
					settle = resolve;
				} )
			);

			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );

			await user.click(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			);
			await user.selectOptions(
				await screen.findByRole( 'combobox', { name: /New connection owner/ } ),
				'7'
			);
			await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );

			await waitFor( () =>
				expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveAttribute(
					'aria-disabled',
					'true'
				)
			);

			settle( { code: 'success' } );

			await expect( screen.findByRole( 'button', { name: 'Close' } ) ).resolves.toBeInTheDocument();
		} );

		it( 'tells the store who owns the connection now', async () => {
			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );

			await user.click(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			);
			await user.selectOptions(
				await screen.findByRole( 'combobox', { name: /New connection owner/ } ),
				'7'
			);
			await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );

			await waitFor( () => expect( mockSetConnectionOwner ).toHaveBeenCalledWith( 7 ) );

			// The task is finished, so the exit closes the dialog rather than going back.
			expect( screen.queryByRole( 'button', { name: 'Back' } ) ).not.toBeInTheDocument();
			await user.click( await screen.findByRole( 'button', { name: 'Close' } ) );

			expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
		} );

		// Two controls reading "Back" would be ambiguous: the step's moves a step, the
		// dialog's leaves the flow entirely.
		it( 'does not offer two different Backs on the confirm step', async () => {
			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );

			await user.click(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			);
			await user.selectOptions(
				await screen.findByRole( 'combobox', { name: /New connection owner/ } ),
				'7'
			);
			await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

			// The step's Back moves a step; the dialog's exit closes the dialog.
			expect( screen.getAllByRole( 'button', { name: 'Back' } ) ).toHaveLength( 1 );
			expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toBeInTheDocument();
		} );

		// Swapping views unmounts whatever had focus, which would otherwise leave a
		// keyboard user on the body, outside the dialog.
		it( 'keeps focus inside the dialog when the view changes', async () => {
			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );

			await user.click(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			);
			await expect(
				screen.findByRole( 'combobox', { name: /New connection owner/ } )
			).resolves.toBeInTheDocument();

			expect(
				screen.getByRole( 'heading', { name: 'Transfer connection ownership' } )
			).toHaveFocus();
		} );

		it( 'leaves the dialog when the chooser is dismissed', async () => {
			const user = userEvent.setup();
			render( <ManageConnectionDialog { ...testProps } /> );

			await user.click(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			);
			await expect(
				screen.findByRole( 'combobox', { name: /New connection owner/ } )
			).resolves.toBeInTheDocument();
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

			expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
		} );

		// Reopening has to start on the actions, not on whatever step was last seen.
		it( 'forgets the step once the dialog has closed', async () => {
			const user = userEvent.setup();
			const { rerender } = render( <ManageConnectionDialog { ...testProps } /> );

			await user.click(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			);
			await expect(
				screen.findByRole( 'combobox', { name: /New connection owner/ } )
			).resolves.toBeInTheDocument();

			rerender( <ManageConnectionDialog { ...testProps } isOpen={ false } /> );
			rerender( <ManageConnectionDialog { ...testProps } /> );

			await expect(
				screen.findByRole( 'link', { name: /Disconnect Jetpack/ } )
			).resolves.toBeInTheDocument();
			expect(
				screen.queryByRole( 'combobox', { name: /New connection owner/ } )
			).not.toBeInTheDocument();
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
