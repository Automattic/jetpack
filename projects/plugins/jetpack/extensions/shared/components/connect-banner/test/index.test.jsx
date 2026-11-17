import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectBanner from '../index';

const mockHandleConnectUser = jest.fn();

jest.mock( '@automattic/jetpack-connection', () => ( {
	// A new function per render, as the real hook returns.
	useConnection: () => ( { handleConnectUser: () => mockHandleConnectUser() } ),
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: jest.fn() } } ),
	useAutosaveAndRedirect: () => ( { autosave: () => Promise.resolve() } ),
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils/components', () => ( {
	Nudge: ( { buttonText, goToCheckoutPage, isRedirecting } ) => (
		<button onClick={ goToCheckoutPage } disabled={ isRedirecting }>
			{ buttonText }
		</button>
	),
} ) );

describe( 'ConnectBanner', () => {
	it( 'requests the connection once per click and re-enables the button when it fails', async () => {
		mockHandleConnectUser.mockRejectedValue( new Error( 'failed' ) );
		const user = userEvent.setup();

		render( <ConnectBanner block="Paywall" /> );
		await user.click( screen.getByRole( 'button', { name: 'Connect Jetpack' } ) );

		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: 'Connect Jetpack' } ) ).toBeEnabled()
		);
		expect( mockHandleConnectUser ).toHaveBeenCalledTimes( 1 );
	} );
} );
