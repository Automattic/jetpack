/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, type UseQueryOptions } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { createStatsListReportHook } from '../use-stats-report';
import type { StatsReportParams } from '../../queries/stats-query';
import type { UseStatsOptions } from '../use-stats-report';
import type { ReactNode } from 'react';

type TestReport = { value: number };
type TestOptions = UseStatsOptions & {
	maxRows?: number;
	group?: string;
};

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: {
			queries: {
				retry: false,
				queryFn: async () => ( { value: 0 } ),
			},
		},
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

describe( 'createStatsListReportHook', () => {
	it( 'forwards list options and keeps the comparison mapper stable', () => {
		const queryFactory = ( params: StatsReportParams ): UseQueryOptions< TestReport > => ( {
			queryKey: [ 'test-stats-list', params.from, params.to ],
			queryFn: async () => ( { value: 1 } ),
			enabled: false,
		} );
		const mergeComparisonRows = jest.fn( () => ( {
			rows: [],
			hasComparison: false,
		} ) );
		const useTestStatsList = createStatsListReportHook<
			StatsReportParams,
			TestReport,
			unknown,
			TestOptions,
			string | undefined
		>( {
			queryFactory,
			reportSlug: 'test-list',
			mergeComparisonRows,
			getOptions: options => {
				const { maxRows, group, ...queryOptions } = options ?? {};

				return { queryOptions, maxRows, mergeOption: group };
			},
		} );
		const params: StatsReportParams = {
			from: '2026-07-01',
			to: '2026-07-07',
			interval: 'day',
		};
		const { rerender } = renderHook(
			( { maxRows } ) =>
				useTestStatsList( params, {
					enabled: false,
					maxRows,
					group: 'posts',
				} ),
			{
				initialProps: { maxRows: 2 },
				wrapper,
			}
		);

		expect( mergeComparisonRows ).toHaveBeenLastCalledWith( undefined, undefined, 2, 'posts' );
		expect( mergeComparisonRows ).toHaveBeenCalledTimes( 1 );

		rerender( { maxRows: 2 } );
		expect( mergeComparisonRows ).toHaveBeenCalledTimes( 1 );

		rerender( { maxRows: 0 } );
		expect( mergeComparisonRows ).toHaveBeenLastCalledWith( undefined, undefined, 0, 'posts' );
		expect( mergeComparisonRows ).toHaveBeenCalledTimes( 2 );
	} );
} );
