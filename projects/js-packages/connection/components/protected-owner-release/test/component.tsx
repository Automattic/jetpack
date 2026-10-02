import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProtectedOwnerRelease, { PROTECTED_OWNER_NOT_OWNER } from '../index';

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

describe( 'ProtectedOwnerRelease', () => {
	const onClose = jest.fn();
	const onReleased = jest.fn();

	const props = {
		isOpen: true,
		onClose,
		onReleased,
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
		render( <ProtectedOwnerRelease { ...props } isOpen={ false } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'warns what releasing costs and who can claim next', () => {
		render( <ProtectedOwnerRelease { ...props } /> );

		expect(
			screen.getByRole( 'dialog', { name: 'Release ownership of this site' } )
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Releasing ownership turns off features that require a confirmed owner. Any connected administrator will then be able to confirm ownership of this site.'
			)
		).toBeInTheDocument();
	} );

	it( 'uses the caller’s subject in the title', () => {
		render( <ProtectedOwnerRelease { ...props } subject="store" /> );
		expect(
			screen.getByRole( 'dialog', { name: 'Release ownership of this store' } )
		).toBeInTheDocument();
	} );

	it( 'closes without a request when cancelled', async () => {
		const user = userEvent.setup();
		render( <ProtectedOwnerRelease { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( mockFetch ).not.toHaveBeenCalled();
		expect( onReleased ).not.toHaveBeenCalled();
	} );

	it( 'posts the release and reports success', async () => {
		mockFetch.mockResolvedValue( jsonResponse( true, { code: 'success' } ) );
		const user = userEvent.setup();
		render( <ProtectedOwnerRelease { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Release ownership' } ) );

		expect( mockFetch ).toHaveBeenCalledWith(
			'https://example.org/wp-json/jetpack/v4/connection/owner/release',
			expect.objectContaining( {
				method: 'POST',
				headers: expect.objectContaining( { 'X-WP-Nonce': 'test-nonce' } ),
			} )
		);
		expect( onReleased ).toHaveBeenCalledTimes( 1 );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'falls back to the script data when the caller passes no REST details', async () => {
		window.JetpackScriptData = {
			connection: { apiRoot: 'https://scriptdata.example/wp-json/', apiNonce: 'script-nonce' },
		} as typeof window.JetpackScriptData;
		mockFetch.mockResolvedValue( jsonResponse( true, { code: 'success' } ) );
		const user = userEvent.setup();
		render( <ProtectedOwnerRelease isOpen onClose={ onClose } onReleased={ onReleased } /> );

		await user.click( screen.getByRole( 'button', { name: 'Release ownership' } ) );

		expect( mockFetch ).toHaveBeenCalledWith(
			'https://scriptdata.example/wp-json/jetpack/v4/connection/owner/release',
			expect.objectContaining( {
				headers: expect.objectContaining( { 'X-WP-Nonce': 'script-nonce' } ),
			} )
		);
	} );

	it( 'shows the support link when WordPress.com does not hold the caller as owner', async () => {
		mockFetch.mockResolvedValue(
			jsonResponse( false, {
				code: PROTECTED_OWNER_NOT_OWNER,
				message: 'Only the confirmed owner can release ownership of this site.',
			} )
		);
		const user = userEvent.setup();
		render( <ProtectedOwnerRelease { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Release ownership' } ) );

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Release ownership of this site',
		} );
		expect(
			within( dialog ).getByText( 'Only the confirmed owner can release ownership of this site.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Contact support' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-support' )
		);
		expect( onReleased ).not.toHaveBeenCalled();
	} );

	it( 'keeps the dialog open when the request never reaches the server', async () => {
		mockFetch.mockRejectedValue( new Error( 'offline' ) );
		const user = userEvent.setup();
		render( <ProtectedOwnerRelease { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Release ownership' } ) );

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Release ownership of this site',
		} );
		expect(
			within( dialog ).getByText( 'Could not release the protected owner.' )
		).toBeInTheDocument();
		expect( onReleased ).not.toHaveBeenCalled();
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the generic message when the refusal carries no usable one', async () => {
		mockFetch.mockResolvedValue( jsonResponse( false, { message: 123, code: 456 } ) );
		const user = userEvent.setup();
		render( <ProtectedOwnerRelease { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: 'Release ownership' } ) );

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Release ownership of this site',
		} );
		expect(
			within( dialog ).getByText( 'Could not release the protected owner.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Contact support' } ) ).not.toBeInTheDocument();
	} );
} );
