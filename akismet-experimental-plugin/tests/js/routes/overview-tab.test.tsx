import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverviewTab } from '@/routes/overview-tab';
import { __resetApiClientMocks } from '../mocks/api-client';
import { setMockState } from '../mocks/handlers';
import { createTestQueryClient } from '../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../mocks/api-client' ) );

/**
 * Render a component with a fresh QueryClient.
 *
 * @param ui - The element to render.
 * @return The render result.
 */
function renderWithClient( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( 'OverviewTab', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	it( 'renders the empty state when no API key is configured', async () => {
		renderWithClient( <OverviewTab /> );
		await expect(
			screen.findByRole( 'button', { name: /Connect Akismet/i } )
		).resolves.toBeInTheDocument();
	} );

	it( 'invokes onNavigateToAccount when the empty-state button is clicked', async () => {
		const onNavigateToAccount = jest.fn();
		renderWithClient( <OverviewTab onNavigateToAccount={ onNavigateToAccount } /> );
		const button = await screen.findByRole( 'button', { name: /Connect Akismet/i } );
		await userEvent.click( button );
		expect( onNavigateToAccount ).toHaveBeenCalled();
	} );

	it( 'renders the headline + six cards once a valid key is set', async () => {
		setMockState( { key: 'abcdef123456', keyValid: true } );
		renderWithClient( <OverviewTab /> );
		await expect(
			screen.findByText( /threats handled in the last 30 days/i )
		).resolves.toBeInTheDocument();
		await expect( screen.findByText( /^Comments$/ ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /^Logins$/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'omits the WooCommerce panel when WC is not active', async () => {
		setMockState( { key: 'abcdef123456', keyValid: true } );
		renderWithClient( <OverviewTab /> );
		// Wait for hydration so we don't false-negative on transient absence.
		await expect( screen.findByText( /^Comments$/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /WooCommerce store protection/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders the WooCommerce panel when WC is active', async () => {
		setMockState( { key: 'abcdef123456', keyValid: true } );
		(
			window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
		 ).akismetExperimental = {
			integrations: { woocommerce: true },
		};
		renderWithClient( <OverviewTab /> );
		await expect(
			screen.findByText( /WooCommerce store protection/i )
		).resolves.toBeInTheDocument();
	} );
} );
