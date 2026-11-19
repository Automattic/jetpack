import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { ADS_ACCOUNT_KEY } from '../ads-keys';
import { toAdsEarnings, useJoinWordAds } from '../wordads';
import { wpcomFetch } from '../wpcom-fetch';
import type { ReactNode } from 'react';

jest.mock( '../wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

describe( 'toAdsEarnings', () => {
	it( 'reads each kind of earnings, newest month first, with PHP’s empty `[]`', () => {
		expect(
			toAdsEarnings( {
				earnings: {
					total_earnings: '12.50',
					total_amount_owed: '2.50',
					wordads: {
						'2026-09': { amount: 2.5, pageviews: '1200', status: '0' },
						'2026-10': { amount: 10, pageviews: 'N/A', status: 1 },
					},
					sponsored: { '2026-08': { amount: '3', status: '4' } },
					adjustment: [],
				},
			} )
		).toEqual( {
			total: 12.5,
			owed: 2.5,
			wordads: [
				{ period: '2026-10', amount: 10, adsServed: null, status: 'paid' },
				{ period: '2026-09', amount: 2.5, adsServed: 1200, status: 'unpaid' },
			],
			sponsored: [ { period: '2026-08', amount: 3, adsServed: null, status: 'invalid-paypal' } ],
			adjustment: [],
		} );
	} );
} );

describe( 'useJoinWordAds', () => {
	it( 'marks the site approved at once, so Settings offers the switch without a refetch', async () => {
		( wpcomFetch as jest.Mock ).mockResolvedValue( {} );
		const queryClient = new QueryClient();
		queryClient.setQueryData( ADS_ACCOUNT_KEY, { approved: false, active: false } );
		const wrapper = ( { children }: { children: ReactNode } ) =>
			createElement( QueryClientProvider, { client: queryClient }, children );
		const { result } = renderHook( () => useJoinWordAds(), { wrapper } );

		await act( () => result.current.mutateAsync() );

		expect( queryClient.getQueryData( ADS_ACCOUNT_KEY ) ).toEqual( {
			approved: true,
			active: false,
		} );
	} );
} );
