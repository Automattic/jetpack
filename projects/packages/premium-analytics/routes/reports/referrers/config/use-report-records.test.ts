import { useStatsReferrers } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useReferrersReportRecords } from './use-report-records';
import type { ReportParams, StatsReferrersComparisonItem } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsReferrers: jest.fn(),
} ) );

const mockUseStatsReferrers = useStatsReferrers as jest.MockedFunction< typeof useStatsReferrers >;

const comparisonRows: StatsReferrersComparisonItem[] = [
	{
		label: 'Search Engines',
		views: 13,
		previousValue: 10,
		link: null,
		icon: null,
		labelIcon: null,
		children: [
			{
				label: 'google.com',
				views: 13,
				previousValue: 8,
				link: 'https://www.google.com/',
				icon: null,
				labelIcon: 'external',
				children: null,
			},
		],
	},
];

describe( 'useReferrersReportRecords', () => {
	beforeEach( () => {
		mockUseStatsReferrers.mockReturnValue( {
			primary: { data: undefined },
			comparison: { data: undefined },
			comparisonRows: { rows: comparisonRows, hasComparison: true },
			hasComparison: true,
			isLoading: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsReferrers > );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'matches the summarized Calypso request and returns parent-linked comparison rows', () => {
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
			comp: '1',
			compare_from: '2026-07-07',
			compare_to: '2026-07-08',
		};
		const { result } = renderHook( () => useReferrersReportRecords( params ) );

		expect( mockUseStatsReferrers ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 1,
			period: 'day',
		} );
		expect( result.current.rows ).toEqual( [
			expect.objectContaining( {
				id: '["Search Engines"]',
				label: 'Search Engines',
				previousValue: 10,
				hasChildren: true,
			} ),
			expect.objectContaining( {
				parentId: '["Search Engines"]',
				label: 'google.com',
				previousValue: 8,
			} ),
		] );
	} );

	it( 'surfaces error and refetch from the report', () => {
		const refetch = jest.fn();
		mockUseStatsReferrers.mockReturnValue( {
			primary: { data: undefined },
			comparison: { data: undefined },
			comparisonRows: { rows: [], hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isError: true,
			refetch,
		} as unknown as ReturnType< typeof useStatsReferrers > );
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};

		const { result } = renderHook( () => useReferrersReportRecords( params ) );

		expect( result.current.isError ).toBe( true );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
