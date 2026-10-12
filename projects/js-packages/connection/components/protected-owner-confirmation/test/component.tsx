import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProtectedOwnerConfirmation, { PROTECTED_OWNER_CLAIMED_BY_OTHER } from '../index';

const mockFetch = jest.fn< typeof fetch >();
const originalFetch = globalThis.fetch;

/**
 * The slice of `Response` the component reads, so the cast is written once.
 *
 * @param {boolean} ok   - Whether the request succeeded.
 * @param {unknown} body - What `json()` resolves to.
 * @return {Response} A stand-in carrying only `ok` and `json`.
 */
function jsonResponse( ok: boolean, body: unknown ): Response {
	const partial: Pick< Response, 'ok' | 'json' > = { ok, json: async () => body };

	return partial as Response;
}

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

	afterEach( () => {
		delete window.JetpackScriptData;
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

	it( 'closes without a request when cancelled', async () => {
		const user = userEvent.setup();
		render( <ProtectedOwnerConfirmation { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( mockFetch ).not.toHaveBeenCalled();
		expect( onConfirmed ).not.toHaveBeenCalled();
	} );

	it( 'posts the claim and reports success', async () => {
		mockFetch.mockResolvedValue( jsonResponse( true, { code: 'success' } ) );
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

	it( 'falls back to the script data when the caller passes no REST details', async () => {
		window.JetpackScriptData = {
			connection: { apiRoot: 'https://scriptdata.example/wp-json/', apiNonce: 'script-nonce' },
		} as typeof window.JetpackScriptData;
		mockFetch.mockResolvedValue( jsonResponse( true, { code: 'success' } ) );
		const user = userEvent.setup();
		render( <ProtectedOwnerConfirmation isOpen onClose={ onClose } onConfirmed={ onConfirmed } /> );

		await user.click( screen.getByRole( 'button', { name: 'Confirm' } ) );

		expect( mockFetch ).toHaveBeenCalledWith(
			'https://scriptdata.example/wp-json/jetpack/v4/connection/owner/protect',
			expect.objectContaining( {
				headers: expect.objectContaining( { 'X-WP-Nonce': 'script-nonce' } ),
			} )
		);
	} );

	it( 'shows the support link when another account already holds the site', async () => {
		mockFetch.mockResolvedValue(
			jsonResponse( false, {
				code: PROTECTED_OWNER_CLAIMED_BY_OTHER,
				message:
					'This site is already protected by a different WordPress.com account. Contact support.',
			} )
		);
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

	it( 'falls back to the generic message when the refusal carries no usable one', async () => {
		mockFetch.mockResolvedValue( jsonResponse( false, { message: 123, code: 456 } ) );
		const user = userEvent.setup();
		render( <ProtectedOwnerConfirmation { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Confirm' } ) );

		const dialog = await screen.findByRole( 'dialog', { name: 'Confirm you are the site owner' } );
		expect(
			within( dialog ).getByText( 'Could not confirm the protected owner.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Contact support' } ) ).not.toBeInTheDocument();
	} );
} );
