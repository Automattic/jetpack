/**
 * Tests for `<AccountTab>` — the wrapper that switches between
 * <ConnectFlow> (no key) and <AccountPanel> (key present).
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { AccountTab } from '@/routes/account-tab';
import { __resetApiClientMocks } from '../mocks/api-client';
import { setMockState } from '../mocks/handlers';
import { createTestQueryClient } from '../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../mocks/api-client' ) );

/**
 * Render with a fresh QueryClient.
 *
 * @param ui - React children.
 * @return The render result.
 */
function renderWith( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( '<AccountTab>', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'shows the connect flow when no key is set', async () => {
		renderWith( <AccountTab /> );
		await expect(
			screen.findByRole( 'button', { name: /i already have a key/i } )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the account panel when a valid key exists', async () => {
		setMockState( { key: 'abcdef123456', keyValid: true } );
		renderWith( <AccountTab /> );
		await expect(
			screen.findByRole( 'button', { name: /disconnect/i } )
		).resolves.toBeInTheDocument();
	} );
} );
