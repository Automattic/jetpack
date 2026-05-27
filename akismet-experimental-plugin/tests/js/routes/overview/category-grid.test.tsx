import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { CategoryGrid } from '@/routes/overview/category-grid';
import { __resetApiClientMocks } from '../../mocks/api-client';
import { createTestQueryClient } from '../../test-utils';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

describe( 'CategoryGrid', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	it( 'renders all six category labels', async () => {
		const client = createTestQueryClient();
		render(
			<QueryClientProvider client={ client }>
				<CategoryGrid interval="30-days" onDrillDown={ () => {} } />
			</QueryClientProvider>
		);
		await expect( screen.findByText( /^Comments$/ ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /^Forms$/ ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /^Logins$/ ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Checkouts & Fraud/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /^Bots$/ ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /^Brute-force$/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows the not-active-here state on the Checkouts card without WooCommerce', async () => {
		const client = createTestQueryClient();
		render(
			<QueryClientProvider client={ client }>
				<CategoryGrid interval="30-days" onDrillDown={ () => {} } />
			</QueryClientProvider>
		);
		await expect(
			screen.findByText( /Not active here\. Requires WooCommerce/i )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the WC card active when window.akismetExperimental flags it on', async () => {
		(
			window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
		 ).akismetExperimental = {
			integrations: { woocommerce: true },
		};
		const client = createTestQueryClient();
		render(
			<QueryClientProvider client={ client }>
				<CategoryGrid interval="30-days" onDrillDown={ () => {} } />
			</QueryClientProvider>
		);
		// 120 = blocked_checkouts default in fakeWooFraud
		await expect( screen.findByText( /120/ ) ).resolves.toBeInTheDocument();
	} );
} );
