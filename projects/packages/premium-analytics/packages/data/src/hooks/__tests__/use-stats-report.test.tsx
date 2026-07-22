/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, type UseQueryOptions } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { createStatsListReportHook, splitStatsListOptions } from '../use-stats-report';
import type { StatsReportParams } from '../../queries/stats-query';
import type { UseStatsOptions } from '../use-stats-report';
import type { ReactNode } from 'react';

type TestReport = { value: number };
type TestOptions = UseStatsOptions & {
	maxRows?: number;
	group?: string;
};

// Built once per file: a client rebuilt inside `wrapper` would be discarded on
// every rerender, so any test that actually fetches would miss its own cache.
const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			retry: false,
			queryFn: async () => ( { value: 0 } ),
		},
	},
} );

function wrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

const params: StatsReportParams = {
	from: '2026-07-01',
	to: '2026-07-07',
	interval: 'day',
};

const queryFactory = ( queryParams: StatsReportParams ): UseQueryOptions< TestReport > => ( {
	queryKey: [ 'test-stats-list', queryParams.from, queryParams.to ],
	queryFn: async () => ( { value: 1 } ),
	enabled: false,
} );

describe( 'createStatsListReportHook', () => {
	it( 'forwards maxRows through splitStatsListOptions when a module has no merge option', () => {
		const mergeComparisonRows = jest.fn( () => ( {
			rows: [],
			hasComparison: false,
		} ) );
		const useTestStatsList = createStatsListReportHook<
			StatsReportParams,
			TestReport,
			unknown,
			TestOptions
		>( {
			queryFactory,
			reportSlug: 'test-default-list',
			mergeComparisonRows,
			getOptions: splitStatsListOptions,
		} );

		renderHook( () => useTestStatsList( params, { enabled: false, maxRows: 3 } ), { wrapper } );

		expect( mergeComparisonRows ).toHaveBeenLastCalledWith( undefined, undefined, 3, undefined );
	} );

	it( 'forwards list options and keeps the comparison mapper stable', () => {
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
