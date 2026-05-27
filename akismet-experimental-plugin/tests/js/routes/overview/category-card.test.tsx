/**
 * Tests for <CategoryCard>. Verifies the three states the plan documents:
 *   - active        → real numbers, no badge
 *   - preview       → numbers + "preview data" badge
 *   - not-active-here → empty-state card with the required-integration copy
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCard } from '@/routes/overview/category-card';
import { __resetApiClientMocks } from '../../mocks/api-client';
import { setMockState } from '../../mocks/handlers';
import { createTestQueryClient } from '../../test-utils';
import type { CategoryId } from '@/routes/overview/category-config';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

/**
 * Render a single CategoryCard with a fresh QueryClient.
 *
 * @param id          - The category id to render.
 * @param onDrillDown - Optional drill-down callback.
 */
function renderCard( id: CategoryId, onDrillDown: ( id: CategoryId ) => void = () => {} ) {
	const client = createTestQueryClient();
	render(
		<QueryClientProvider client={ client }>
			<CategoryCard id={ id } interval="30-days" onDrillDown={ onDrillDown } />
		</QueryClientProvider>
	);
}

describe( 'CategoryCard', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error — test cleanup
		delete window.akismetExperimental;
	} );

	it( 'renders the Comments card with the preview-data badge (mock branch)', async () => {
		renderCard( 'comments' );
		await expect( screen.findByText( /^Comments$/ ) ).resolves.toBeInTheDocument();
		// Badge appears once data resolves — async.
		await expect( screen.findByText( /preview data/i ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows blocked count on the Logins card', async () => {
		setMockState( {
			blackboxAggregates: { 'logins|30-days': { blocked: 555 } },
		} );
		renderCard( 'logins' );
		await expect( screen.findByText( /555/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders the Logins card with the preview-data badge', async () => {
		renderCard( 'logins' );
		await expect( screen.findByText( /^Logins$/ ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /preview data/i ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders Checkouts as not-active-here when WooCommerce is absent', async () => {
		renderCard( 'checkouts' );
		await expect(
			screen.findByText( /Not active here\. Requires WooCommerce/i )
		).resolves.toBeInTheDocument();
	} );

	it( 'invokes onDrillDown when the See activity button is clicked', async () => {
		const onDrillDown = jest.fn();
		renderCard( 'comments', onDrillDown );
		const button = await screen.findByRole( 'button', { name: /see activity/i } );
		await userEvent.click( button );
		expect( onDrillDown ).toHaveBeenCalledWith( 'comments' );
	} );
} );
