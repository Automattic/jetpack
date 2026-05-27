import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { WooCommercePanel } from '@/routes/overview/woocommerce-panel';
import { __resetApiClientMocks } from '../../mocks/api-client';
import { setMockState } from '../../mocks/handlers';
import { createTestQueryClient } from '../../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

/**
 * Wrap a component in a fresh QueryClient.
 *
 * @param ui - The element to render.
 * @return The render result for further assertions.
 */
function renderWithClient( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( 'WooCommercePanel', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	it( 'renders nothing when WooCommerce is not active', () => {
		const { container } = renderWithClient( <WooCommercePanel interval="30-days" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders three metric cards + top signals when WC is active', async () => {
		(
			window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
		 ).akismetExperimental = {
			integrations: { woocommerce: true },
		};
		renderWithClient( <WooCommercePanel interval="30-days" /> );
		await expect(
			screen.findByText( /WooCommerce store protection/i )
		).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Orders flagged/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Blocked checkouts/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Chargebacks averted/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /avs_mismatch/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows the preview badge when the WFP plugin is not detected (wfp_active=false)', async () => {
		(
			window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } }
		 ).akismetExperimental = {
			integrations: { woocommerce: true },
		};
		setMockState( {
			wooFraud: { '30-days': { wfp_active: false } },
		} );
		renderWithClient( <WooCommercePanel interval="30-days" /> );
		await expect( screen.findByText( /preview data/i ) ).resolves.toBeInTheDocument();
	} );
} );
