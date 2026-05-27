/**
 * Tests for `<AccountPanel>` — the connected-state UI for the Account tab.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountPanel } from '@/routes/account/account-panel';
import { apiClient, __resetApiClientMocks } from '../../mocks/api-client';
import { setMockState } from '../../mocks/handlers';
import { createTestQueryClient } from '../../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

/**
 * Flip allowMutations on for a single test; returns the matching cleanup.
 *
 * @return Cleanup function.
 */
function enableMutations(): () => void {
	(
		window as unknown as { akismetExperimental: { allowMutations: boolean } }
	 ).akismetExperimental = { allowMutations: true };
	return () => {
		// @ts-expect-error - cleanup
		delete window.akismetExperimental;
	};
}

/**
 * Render `<AccountPanel>` inside a fresh QueryClientProvider.
 *
 * @param ui - React children.
 * @return The render result.
 */
function renderWith( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( '<AccountPanel>', () => {
	let restore: () => void = () => {};
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => restore() );

	it( 'shows the masked key + disconnect button when connected', async () => {
		setMockState( { key: 'abcdef123456', keyValid: true } );
		renderWith( <AccountPanel /> );
		// Mask keeps the leading 4 characters visible; rest are bullets.
		await expect( screen.findByText( /abcd•+/ ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /disconnect/i } ) ).toBeInTheDocument();
	} );

	it( 'short-circuits the disconnect with a preview-mode notice when gated', async () => {
		setMockState( { key: 'abcdef123456', keyValid: true } );
		renderWith( <AccountPanel /> );
		const btn = await screen.findByRole( 'button', { name: /disconnect/i } );
		await userEvent.click( btn );
		expect( ( await screen.findAllByText( /preview mode/i ) )[ 0 ] ).toBeInTheDocument();
		expect( apiClient.delete ).not.toHaveBeenCalled();
	} );

	it( 'updates to the disconnected state after a successful delete', async () => {
		restore = enableMutations();
		setMockState( { key: 'abcdef123456', keyValid: true } );
		renderWith( <AccountPanel /> );
		const btn = await screen.findByRole( 'button', { name: /disconnect/i } );
		await userEvent.click( btn );
		expect( ( await screen.findAllByText( /no active key/i ) )[ 0 ] ).toBeInTheDocument();
		expect( apiClient.delete ).toHaveBeenCalledWith( 'key' );
	} );
} );
