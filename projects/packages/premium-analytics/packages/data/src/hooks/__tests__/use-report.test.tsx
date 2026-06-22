/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, type UseQueryOptions } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReport } from '../use-report';
import type { ReportParams } from '../../utils/search';
import type { ReactNode } from 'react';

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

describe( 'useReport', () => {
	it( 'keeps endpoint-specific params and overrides only comparison dates', () => {
		const calls: Array< { params: ReportParams; queryType: string } > = [];
		const queryFactory = (
			params: ReportParams,
			queryType: string
		): UseQueryOptions< { summary: Record< string, unknown >; data: unknown[] } > => {
			calls.push( { params, queryType } );

			return {
				queryKey: [ 'test-report', queryType, params.from, params.to, params.period ],
				queryFn: async () => ( { summary: {}, data: [] } ),
				enabled: false,
			};
		};

		renderHook(
			() =>
				useReport(
					queryFactory,
					{
						from: '2026-06-01',
						to: '2026-06-07',
						compare_from: '2026-05-01',
						compare_to: '2026-05-07',
						compare_preset: 'previous-period',
						comp: '1',
						interval: 'day',
						period: 'day',
						section: 'stats',
					},
					{
						enabled: false,
					}
				),
			{ wrapper }
		);

		expect( calls ).toEqual( [
			{
				queryType: 'primary',
				params: expect.objectContaining( {
					from: '2026-06-01',
					to: '2026-06-07',
					interval: 'day',
					period: 'day',
					section: 'stats',
				} ),
			},
			{
				queryType: 'comparison',
				params: expect.objectContaining( {
					from: '2026-05-01',
					to: '2026-05-07',
					interval: 'day',
					period: 'day',
					section: 'stats',
				} ),
			},
		] );
		expect( calls[ 0 ].params ).not.toHaveProperty( 'compare_from' );
		expect( calls[ 1 ].params ).not.toHaveProperty( 'compare_from' );
	} );
} );
