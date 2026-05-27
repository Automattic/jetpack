import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { ThreatKPIs } from '@/routes/overview/threat-kpis';
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
 */
function renderWithClient( ui: ReactNode ) {
	const client = createTestQueryClient();
	render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( 'ThreatKPIs', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	it( 'renders the "threats handled" headline once data hydrates', async () => {
		renderWithClient( <ThreatKPIs interval="30-days" /> );
		await expect(
			screen.findByText( /threats handled in the last 30 days/i )
		).resolves.toBeInTheDocument();
	} );

	it( 'displays a preview caveat when any category is mocked', async () => {
		// Defaults: Comments + 4 blackbox cards all carry preview:true.
		renderWithClient( <ThreatKPIs interval="30-days" /> );
		await expect( screen.findByText( /preview-data categories/i ) ).resolves.toBeInTheDocument();
	} );

	it( 'sums Comments + Blackbox categories into the headline', async () => {
		// Force every Blackbox category to 0 so the headline equals
		// only the comments contribution (spam + ham = blocked + passed).
		setMockState( {
			stats: { '30-days': { spam: 5, ham: 2 } },
			blackboxAggregates: {
				'forms|30-days': { blocked: 0, challenged: 0, passed: 0 },
				'logins|30-days': { blocked: 0, challenged: 0, passed: 0 },
				'bots|30-days': { blocked: 0, challenged: 0, passed: 0 },
				'brute-force|30-days': { blocked: 0, challenged: 0, passed: 0 },
			},
		} );
		renderWithClient( <ThreatKPIs interval="30-days" /> );
		await expect( screen.findByText( /^7$/ ) ).resolves.toBeInTheDocument();
	} );
} );
