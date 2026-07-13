import { jest } from '@jest/globals';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockUnlinkUser = jest.fn();
const mockSetApiRoot = jest.fn();
const mockSetApiNonce = jest.fn();
const mockRecordEvent = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: mockSetApiRoot,
		setApiNonce: mockSetApiNonce,
		unlinkUser: mockUnlinkUser,
	},
} ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent } },
} ) );

const { default: OwnerDisconnectDialog } = await import( '../index' );

describe( 'OwnerDisconnectDialog', () => {
	const testProps = {
		apiNonce: 'test-nonce',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true, // nothing renders if false
		onClose: jest.fn(),
	};

	const dialogName = 'Disconnect Owner Account';

	beforeEach( () => {
		jest.clearAllMocks();
		mockUnlinkUser.mockResolvedValue( undefined );
	} );

	it( 'renders nothing when isOpen is false', () => {
		render( <OwnerDisconnectDialog { ...testProps } isOpen={ false } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	describe( 'when open', () => {
		it( 'renders the labelled Modal', () => {
			render( <OwnerDisconnectDialog { ...testProps } /> );
			// Modal aria.labelledby points at the heading; assert both resolve to the same label.
			expect( screen.getByRole( 'dialog', { name: dialogName } ) ).toBeInTheDocument();
			expect(
				within( screen.getByRole( 'dialog', { name: dialogName } ) ).getByRole( 'heading' )
			).toHaveTextContent( dialogName );
		} );

		it( 'seeds the REST API with the passed root and nonce', () => {
			render( <OwnerDisconnectDialog { ...testProps } /> );
			expect( mockSetApiRoot ).toHaveBeenCalledWith( testProps.apiRoot );
			expect( mockSetApiNonce ).toHaveBeenCalledWith( testProps.apiNonce );
		} );

		it( 'renders both action cards as links', () => {
			render( <OwnerDisconnectDialog { ...testProps } /> );
			expect(
				screen.getByRole( 'link', { name: /Transfer ownership to another admin/ } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'link', { name: /View other connected accounts/ } )
			).toBeInTheDocument();
		} );

		it( 'calls onClose when "Stay Connected" is clicked', async () => {
			const user = userEvent.setup();
			render( <OwnerDisconnectDialog { ...testProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Stay Connected' } ) );
			expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'disconnect flow', () => {
		it( 'unlinks and fires success callbacks on Disconnect', async () => {
			const user = userEvent.setup();
			const onDisconnected = jest.fn();
			const onUnlinked = jest.fn();
			render(
				<OwnerDisconnectDialog
					{ ...testProps }
					onDisconnected={ onDisconnected }
					onUnlinked={ onUnlinked }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			expect( mockUnlinkUser ).toHaveBeenCalledWith( true, { disconnectAllUsers: true } );
			await waitFor( () => expect( onDisconnected ).toHaveBeenCalledTimes( 1 ) );
			expect( onUnlinked ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'shows an error and re-enables the button when unlink fails', async () => {
			const user = userEvent.setup();
			mockUnlinkUser.mockRejectedValueOnce( new Error( 'nope' ) );
			render( <OwnerDisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect(
				screen.findByText( /There was a problem disconnecting your account/ )
			).resolves.toBeInTheDocument();
			// Button re-enabled after failure so the user can retry.
			expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toBeEnabled();
		} );
	} );
} );
