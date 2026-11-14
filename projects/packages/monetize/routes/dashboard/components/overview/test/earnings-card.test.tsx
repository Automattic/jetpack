import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import EarningsCard, { CommissionFees } from '../earnings-card';

jest.mock( '../state', () => ( { getOverviewState: () => ( { upgradeCommission: 0.02 } ) } ) );
jest.mock( '../../../data/state', () => ( {
	getPageData: () => ( { upgradeUrl: 'https://example.com/upgrade', tracks: true } ),
} ) );
jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

describe( 'EarningsCard', () => {
	it( 'shows each WordPress.com figure in its place', async () => {
		( wpcomFetch as jest.Mock ).mockResolvedValue( {
			total: 1200,
			last_month: 300,
			forecast: 45,
			currency: 'EUR',
			commission: 0.1,
		} );
		render(
			<QueryClientProvider client={ new QueryClient() }>
				<EarningsCard />
			</QueryClientProvider>
		);

		// In label order: total, last 30 days, next month.
		const figures = await screen.findAllByText( /^€/ );
		expect( figures.map( figure => figure.textContent ) ).toEqual( [
			'€1,200.00',
			'€300.00',
			'€45.00',
		] );
		expect( screen.getByText( /transaction fee for payments is 10%/ ) ).toBeVisible();
	} );
} );

describe( 'CommissionFees', () => {
	it.each( [
		[ 'above', 0.04, true ],
		[ 'equal to', 0.02, false ],
	] )( 'with a fee %s the upgrade’s, offers the upgrade: %p', ( _case, commission, offers ) => {
		render( <CommissionFees commission={ commission } /> );

		expect( Boolean( screen.queryByRole( 'link', { name: 'Upgrade to lower it.' } ) ) ).toBe(
			offers
		);
	} );
} );
