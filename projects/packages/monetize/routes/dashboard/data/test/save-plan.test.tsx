import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { useSavePlan } from '../memberships';
import { wpcomFetch } from '../wpcom-fetch';
import type { ProductPayload } from '../memberships';
import type { ReactNode } from 'react';

jest.mock( '../wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

const PAYLOAD = { title: 'Gold', price: 5, interval: '1 month', type: 'tier' } as ProductPayload;

describe( 'useSavePlan', () => {
	it.each( [
		[ 'creates', {}, { id: 7 }, 'memberships/product', 'memberships/product' ],
		[
			'updates',
			{ monthly: 7, annual: 8 },
			{ product: { id: 7 } },
			'memberships/product/7',
			'memberships/product/8',
		],
	] )(
		'%s a tier’s monthly product, then its annual one naming it',
		async ( _name, ids, monthlyResponse, monthlyPath, annualPath ) => {
			( wpcomFetch as jest.Mock )
				.mockReset()
				.mockResolvedValueOnce( monthlyResponse )
				.mockResolvedValue( {} );
			const wrapper = ( { children }: { children: ReactNode } ) => (
				<QueryClientProvider client={ new QueryClient() }>{ children }</QueryClientProvider>
			);
			const { result } = renderHook( () => useSavePlan(), { wrapper } );

			await act( () => result.current.mutateAsync( { payload: PAYLOAD, annualPrice: 50, ids } ) );

			const requests = ( wpcomFetch as jest.Mock ).mock.calls.map( ( [ request ] ) => request );
			expect( requests ).toEqual( [
				expect.objectContaining( { path: monthlyPath, data: PAYLOAD } ),
				expect.objectContaining( {
					path: annualPath,
					data: { ...PAYLOAD, price: 50, interval: '1 year', tier: 7 },
				} ),
			] );
		}
	);
} );
