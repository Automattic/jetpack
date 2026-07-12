/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { reportOrderAttributionSummaryQuery } from '../../queries';
import { useReportOrderAttribution } from '../use-report-order-attribution';
import type { ReportParams } from '../../utils/search';
import type { ReactNode } from 'react';

jest.mock( '../../queries', () => ( {
	reportOrderAttributionSummaryQuery: jest.fn( () => ( {
		queryKey: [ 'reports', 'order-attribution' ],
		queryFn: async () => ( { data: [] } ),
		enabled: false,
	} ) ),
} ) );

const mockReportOrderAttributionSummaryQuery =
	reportOrderAttributionSummaryQuery as jest.MockedFunction<
		typeof reportOrderAttributionSummaryQuery
	>;

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: {
			queries: {
				queryFn: async () => ( { data: [] } ),
				retry: false,
			},
		},
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

describe( 'useReportOrderAttribution', () => {
	it( 'forwards product filters to the order attribution summary query', () => {
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
					{
						enabled: false,
					}
				),
			{ wrapper }
		);

		expect( mockReportOrderAttributionSummaryQuery ).toHaveBeenCalledWith(
			expect.objectContaining( {
				from: '2026-06-01',
				to: '2026-06-07',
				compare_from: '2026-05-25',
				compare_to: '2026-05-31',
				interval: 'day',
				view: 'device',
				filters,
			} )
		);
	} );
} );
