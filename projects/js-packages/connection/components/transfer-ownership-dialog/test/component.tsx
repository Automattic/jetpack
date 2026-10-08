import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the module
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockSetConnectionOwner = jest.fn< ( id: number ) => Promise< unknown > >();

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
				},
			] ),
		setConnectionOwner: mockSetConnectionOwner,
	},
} ) );

const { default: TransferOwnershipDialog } = await import( '../index' );

describe( 'TransferOwnershipDialog', () => {
	const testProps = {
		apiRoot: 'https://example.org/wp-json/',
		apiNonce: 'test-nonce',
		isOpen: true,
		onClose: jest.fn(),
	};

	const transfer = async ( user: ReturnType< typeof userEvent.setup > ) => {
		await user.click( await screen.findByRole( 'combobox', { name: /New connection owner/ } ) );
		await user.click( await screen.findByRole( 'option', { name: /Kazz/ } ) );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );
		await waitFor( () => expect( mockSetConnectionOwner ).toHaveBeenCalledWith( 7 ) );
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockSetConnectionOwner.mockResolvedValue( { code: 'success' } );
	} );

	it( 'renders nothing when closed', () => {
		render( <TransferOwnershipDialog { ...testProps } isOpen={ false } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'just closes when the user leaves without transferring', async () => {
		const onTransferred = jest.fn();
		const user = userEvent.setup();
		render( <TransferOwnershipDialog { ...testProps } onTransferred={ onTransferred } /> );
		await expect(
			screen.findByRole( 'combobox', { name: /New connection owner/ } )
		).resolves.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( testProps.onClose ).toHaveBeenCalledTimes( 1 );
		expect( onTransferred ).not.toHaveBeenCalled();
	} );

	// The modal's X and Escape share this handler, but neither reaches it under jsdom.
	it( 'refreshes instead of closing once ownership has moved', async () => {
		const onTransferred = jest.fn();
		const user = userEvent.setup();
		render( <TransferOwnershipDialog { ...testProps } onTransferred={ onTransferred } /> );

		await transfer( user );
		await user.click( await screen.findByRole( 'button', { name: 'Done' } ) );

		expect( onTransferred ).toHaveBeenCalledWith( 7 );
		expect( testProps.onClose ).not.toHaveBeenCalled();
	} );
} );
