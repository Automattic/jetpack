import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProtectedOwnerConfirmation from '../index';

const mockFetch = jest.fn< typeof fetch >();
const originalFetch = globalThis.fetch;

describe( 'ProtectedOwnerConfirmation', () => {
	const onClose = jest.fn();
	const onConfirmed = jest.fn();

	const props = {
		isOpen: true,
		onClose,
		onConfirmed,
		apiRoot: 'https://example.org/wp-json/',
		apiNonce: 'test-nonce',
	};

	beforeEach( () => {
		jest.clearAllMocks();
		globalThis.fetch = mockFetch;
	} );

	afterAll( () => {
		globalThis.fetch = originalFetch;
	} );

	it( 'renders nothing when closed', () => {
		render( <ProtectedOwnerConfirmation { ...props } isOpen={ false } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'asks the current user to lock the connection to their account', () => {
		render( <ProtectedOwnerConfirmation { ...props } /> );

		expect(
			screen.getByRole( 'dialog', { name: 'Confirm you are the site owner' } )
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'This WordPress.com account becomes the confirmed owner. The connection stays locked to this account.'
			)
		).toBeInTheDocument();
	} );

	it( 'uses the caller’s subject in the title', () => {
		render( <ProtectedOwnerConfirmation { ...props } subject="store" /> );
		expect(
			screen.getByRole( 'dialog', { name: 'Confirm you are the store owner' } )
		).toBeInTheDocument();
	} );

	it( 'names the plugins that requested confirmation', () => {
		render(
			<ProtectedOwnerConfirmation { ...props } requestingPlugins={ [ 'WooPayments', 'Jetpack' ] } />
		);
		expect( screen.getByText( 'Requested by WooPayments and Jetpack.' ) ).toBeInTheDocument();
	} );

	it( 'closes without a request when cancelled', async () => {
		const user = userEvent.setup();
		render( <ProtectedOwnerConfirmation { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( mockFetch ).not.toHaveBeenCalled();
		expect( onConfirmed ).not.toHaveBeenCalled();
	} );

	it( 'posts the claim and reports success', async () => {
		mockFetch.mockResolvedValue( {
			ok: true,
			json: async () => ( { code: 'success' } ),
		} as Response );
		const user = userEvent.setup();
		render( <ProtectedOwnerConfirmation { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Confirm' } ) );

		expect( mockFetch ).toHaveBeenCalledWith(
			'https://example.org/wp-json/jetpack/v4/connection/owner/protect',
			expect.objectContaining( {
				method: 'POST',
				headers: expect.objectContaining( { 'X-WP-Nonce': 'test-nonce' } ),
			} )
		);
		expect( onConfirmed ).toHaveBeenCalledTimes( 1 );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows the support link when another account already holds the site', async () => {
		mockFetch.mockResolvedValue( {
			ok: false,
			json: async () => ( {
				code: 'protected_owner_claimed_by_other',
				message:
					'This site is already protected by a different WordPress.com account. Contact support.',
			} ),
		} as Response );
		const user = userEvent.setup();
		render( <ProtectedOwnerConfirmation { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Confirm' } ) );

		const dialog = await screen.findByRole( 'dialog', { name: 'Confirm you are the site owner' } );
		expect(
			within( dialog ).getByText(
				'This site is already protected by a different WordPress.com account. Contact support.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Contact support' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-support' )
		);
		expect( onConfirmed ).not.toHaveBeenCalled();
	} );
} );
