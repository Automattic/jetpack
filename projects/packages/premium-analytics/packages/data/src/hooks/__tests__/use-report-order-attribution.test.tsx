/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReportOrderAttribution } from '../use-report-order-attribution';
import type { ReportParams } from '../../utils/search';
import type { ReactNode } from 'react';

describe( 'useReportOrderAttribution', () => {
	it( 'keys the summary query on the view and the comparison window useReport strips', () => {
		// The parked comparison query has no queryFn of its own.
		const queryClient = new QueryClient( {
			defaultOptions: { queries: { queryFn: async () => ( { data: [] } ) } },
		} );
		const filters: ReportParams[ 'filters' ] = [
			{
				key: 'product_type',
				value: [ 'booking', 'bookable-event', 'bookable-service' ],
				compare: 'IN',
			},
		];

		renderHook(
			() =>
				useReportOrderAttribution(
					{
						from: '2026-06-01',
						to: '2026-06-07',
						compare_from: '2026-05-25',
						compare_to: '2026-05-31',
						interval: 'day',
						view: 'device',
						filters,
					},
					{ enabled: false }
				),
			{
				wrapper: ( { children }: { children: ReactNode } ) => (
					<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
				),
			}
		);

		expect(
			queryClient
				.getQueryCache()
				.getAll()
				.map( query => query.queryKey )
		).toContainEqual( [
			'reports',
			'order-attribution',
			'device',
			'2026-06-01',
			'2026-06-07',
			'day',
			undefined,
			'2026-05-25',
			'2026-05-31',
			filters,
			expect.any( String ),
		] );
		queryClient.clear();
	} );
} );
