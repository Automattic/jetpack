/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useStatsSearchTerms } from '@jetpack-premium-analytics/data';
import useSearchTermViews from '../use-search-term-views';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsSearchTerms: jest.fn(),
} ) );

const mockUseStatsSearchTerms = useStatsSearchTerms as jest.MockedFunction<
	typeof useStatsSearchTerms
>;

const REPORT_PARAMS = { preset: 'last-7-days' } as unknown as ReportParams;

function report( labels: Array< [ string, number ] > ) {
	return {
		data: [ { items: labels.map( ( [ label, views ] ) => ( { label, views } ) ) } ],
	};
}

function queryResult( overrides: Record< string, unknown > ) {
	return {
		data: undefined,
		isLoading: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	};
}

describe( 'useSearchTermViews', () => {
	beforeEach( () => {
		mockUseStatsSearchTerms.mockReset();
	} );

	it( 'surfaces isError when the fetch failed and there are no rows to show', () => {
		mockUseStatsSearchTerms.mockReturnValue( {
			primary: queryResult( { isError: true } ),
			comparison: queryResult( {} ),
			comparisonRows: { rows: [], hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: true,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsSearchTerms > );

		const { result } = renderHook( () =>
			useSearchTermViews( { reportParams: REPORT_PARAMS, max: 10 } )
		);

		expect( result.current.isError ).toBe( true );
		expect( result.current.data ).toEqual( [] );
	} );

	it( 'keeps stale rows and does not surface isError on a transient refetch error', () => {
		// placeholderData retains the previous period's rows while the query reports error.
		mockUseStatsSearchTerms.mockReturnValue( {
			primary: queryResult( { data: report( [ [ 'coffee', 42 ] ] ), isError: true } ),
			comparison: queryResult( {} ),
			comparisonRows: {
				rows: [ { label: 'coffee', views: 42 } ],
				hasComparison: false,
			},
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: true,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsSearchTerms > );

		const { result } = renderHook( () =>
			useSearchTermViews( { reportParams: REPORT_PARAMS, max: 10 } )
		);

		expect( result.current.isError ).toBe( false );
		expect( result.current.data ).toEqual( [
			{ label: 'coffee', views: 42, previousViews: undefined },
		] );
	} );

	it( 'drops to a non-comparison view when the comparison query fails but primary has rows', () => {
		// A comparison-only failure must not render period-over-period deltas from a
		// `previousViews` of 0. The primary rows still show, without comparison.
		mockUseStatsSearchTerms.mockReturnValue( {
			primary: queryResult( { data: report( [ [ 'coffee', 42 ] ] ) } ),
			comparison: queryResult( { data: report( [ [ 'coffee', 30 ] ] ), isError: true } ),
			comparisonRows: {
				rows: [ { label: 'coffee', views: 42, previousViews: 30 } ],
				hasComparison: true,
			},
			hasComparison: true,
			isLoading: false,
			isFetching: false,
			isError: true,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsSearchTerms > );

		const { result } = renderHook( () =>
			useSearchTermViews( { reportParams: REPORT_PARAMS, max: 10 } )
		);

		expect( result.current.isError ).toBe( false );
		expect( result.current.hasComparison ).toBe( false );
		expect( result.current.data ).toEqual( [
			{ label: 'coffee', views: 42, previousViews: undefined },
		] );
	} );

	it( 'forwards the data layer combined refetch and isFetching', () => {
		// The data layer's refetch already awaits both queries and skips the
		// comparison query when comparison is disabled — the hook must forward
		// it rather than re-derive the fan-out.
		const refetch = jest.fn();
		mockUseStatsSearchTerms.mockReturnValue( {
			primary: queryResult( { data: report( [] ) } ),
			comparison: queryResult( { data: report( [] ) } ),
			comparisonRows: { rows: [], hasComparison: true },
			hasComparison: true,
			isLoading: false,
			isFetching: true,
			isError: false,
			refetch,
		} as unknown as ReturnType< typeof useStatsSearchTerms > );

		const { result } = renderHook( () =>
			useSearchTermViews( { reportParams: REPORT_PARAMS, max: 10 } )
		);
		result.current.refetch();

		expect( refetch ).toHaveBeenCalledTimes( 1 );
		expect( result.current.isFetching ).toBe( true );
	} );
} );
