import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the module
// with unstable_mockModule (must run before the dynamic import of the component below).
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: jest.fn(),
		setApiNonce: jest.fn(),
		fetchConnectionOwnerCandidates: () =>
			Promise.resolve( [
				{
					id: 7,
					login: 'kazz',
					displayName: 'Kazz',
					email: 'kazz@example.com',
					avatar: 'https://example.com/kazz.png',
				},
			] ),
		setConnectionOwner: jest.fn(),
	},
} ) );

window.JP_CONNECTION_INITIAL_STATE = {
	hasProtectedOwner: true,
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: TransferConnectionOwnership } = await import( '../index' );

describe( 'TransferConnectionOwnership on a protected-owner site', () => {
	const props = {
		apiRoot: 'https://example.org/wp-json/',
		apiNonce: 'test-nonce',
	};

	it( 'warns what the transfer costs before they commit', async () => {
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );

		await expect( screen.findByRole( 'option', { name: /Kazz/ } ) ).resolves.toBeInTheDocument();
		await user.selectOptions(
			screen.getByRole( 'combobox', { name: /New connection owner/ } ),
			'7'
		);
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		await expect(
			screen.findByText( "You're the protected owner of this connection" )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( /needs to confirm protected ownership/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Transfer anyway' } ) ).toBeInTheDocument();
	} );
} );
