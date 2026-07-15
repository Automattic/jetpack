import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockDisconnectSite = jest.fn< () => Promise< unknown > >();
const mockSetApiRoot = jest.fn();
const mockSetApiNonce = jest.fn();
const mockRecordEvent = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: mockSetApiRoot,
		setApiNonce: mockSetApiNonce,
		disconnectSite: mockDisconnectSite,
	},
} ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent }, initialize: jest.fn() },
} ) );

const { default: DisconnectDialog } = await import( '../index' );

describe( 'DisconnectDialog', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true, // render open for tests, nothing renders if this is false
		onClose: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Initially', () => {
		it( 'renders the Modal', () => {
			render( <DisconnectDialog { ...testProps } /> );
			expect(
				screen.getByRole( 'dialog', { name: 'Are you sure you want to disconnect?' } )
			).toBeInTheDocument();
		} );

		it( 'renders the "StepDisconnect" step', () => {
			render( <DisconnectDialog { ...testProps } /> );
			expect(
				within(
					screen.getByRole( 'dialog', { name: 'Are you sure you want to disconnect?' } )
				).getByRole( 'heading' )
			).toHaveTextContent( 'Are you sure you want to disconnect?' );
		} );
	} );

	describe( 'when disconnecting fails', () => {
		it( 'shows the Error instance message', async () => {
			mockDisconnectSite.mockRejectedValueOnce( new Error( 'network is down' ) );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect( screen.findByText( 'network is down' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows a plain string rejection as-is', async () => {
			mockDisconnectSite.mockRejectedValueOnce( 'just a string rejection' );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect( screen.findByText( 'just a string rejection' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows a default message instead of rendering a non-Error, non-string rejection raw', async () => {
			mockDisconnectSite.mockRejectedValueOnce( { code: 'weird_shape' } );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect(
				screen.findByText( 'There was a problem disconnecting your account. Please try again.' )
			).resolves.toBeInTheDocument();
		} );

		it( 'calls onError with the raw rejection value', async () => {
			const rejection = new Error( 'boom' );
			mockDisconnectSite.mockRejectedValueOnce( rejection );
			const onError = jest.fn();
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } onError={ onError } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect( screen.findByText( 'boom' ) ).resolves.toBeInTheDocument();
			expect( onError ).toHaveBeenCalledWith( rejection );
		} );
	} );

	describe( 'when disconnecting succeeds', () => {
		it( 'advances to the confirm step', async () => {
			mockDisconnectSite.mockResolvedValueOnce( undefined );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect(
				screen.findByText( /Jetpack has been successfully disconnected/i )
			).resolves.toBeInTheDocument();
		} );
	} );
} );
