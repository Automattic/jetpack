import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { useSavePlan } from '../memberships';
import { wpcomFetch } from '../wpcom-fetch';
import type { ProductPayload } from '../memberships';
import type { ReactNode } from 'react';

jest.mock( '../wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

const PAYLOAD = { title: 'Gold', price: 5, interval: '1 month', type: 'tier' } as ProductPayload;

const wrapper = ( { children }: { children: ReactNode } ) => (
	<QueryClientProvider client={ new QueryClient() }>{ children }</QueryClientProvider>
);

const requestedPaths = () =>
	( wpcomFetch as jest.Mock ).mock.calls.map( ( [ request ] ) => request.path );

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

	it( 'updates the monthly product it created when retrying a failed annual save', async () => {
		( wpcomFetch as jest.Mock )
			.mockReset()
			.mockResolvedValueOnce( { id: 7 } )
			.mockRejectedValueOnce( new Error( 'Annual failed' ) )
			.mockResolvedValueOnce( { product: { id: 7 } } )
			.mockResolvedValue( {} );
		const { result } = renderHook( () => useSavePlan(), { wrapper } );
		const variables = { payload: PAYLOAD, annualPrice: 50 };

		await act( () => result.current.mutateAsync( variables ).catch( () => undefined ) );
		await act( () => result.current.mutateAsync( variables ) );

		expect( requestedPaths() ).toEqual( [
			'memberships/product',
			'memberships/product',
			'memberships/product/7',
			'memberships/product',
		] );
	} );
} );
