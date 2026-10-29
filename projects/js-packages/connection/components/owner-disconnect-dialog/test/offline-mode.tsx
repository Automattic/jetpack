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

// Own file because the store fixes its state when `state/store` is first evaluated.
window.JP_CONNECTION_INITIAL_STATE = {
	isOfflineMode: true,
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: OwnerDisconnectDialog } = await import( '../index' );

describe( 'OwnerDisconnectDialog, in offline mode', () => {
	// Disabled rather than refused on click, so the control shows it cannot run. The
	// @wordpress/ui Button marks itself aria-disabled rather than disabled, so assert the
	// click is inert too rather than trusting the attribute alone.
	it( 'disables Disconnect, so the cascade cannot be started', async () => {
		const user = userEvent.setup();
		render(
			<OwnerDisconnectDialog
				isOpen
				onClose={ jest.fn() }
				apiRoot="https://example.org/wp-json/"
				apiNonce="test-nonce"
			/>
		);

		const disconnect = screen.getByRole( 'button', { name: 'Disconnect' } );
		expect( disconnect ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( disconnect );
		expect( mockUnlinkUser ).not.toHaveBeenCalled();
	} );
} );
