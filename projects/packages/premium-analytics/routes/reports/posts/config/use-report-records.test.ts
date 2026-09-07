/**
 * External dependencies
 */
import { useStatsArchives, useStatsTopPosts } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { usePostsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsArchivesComparisonItem,
	StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsArchives: jest.fn(),
	useStatsTopPosts: jest.fn(),
} ) );

const mockUseStatsArchives = useStatsArchives as jest.MockedFunction< typeof useStatsArchives >;
const mockUseStatsTopPosts = useStatsTopPosts as jest.MockedFunction< typeof useStatsTopPosts >;

const postRows: StatsTopPostsComparisonItem[] = [
	{
		id: 1,
		label: 'Analytical Engine',
		views: 13,
		link: 'https://example.com/analytical-engine/',
		type: 'post',
	},
];

const archiveRows: StatsArchivesComparisonItem[] = [
	{
		label: 'tax',
		value: 8,
		children: [
			{
				label: 'category',
				value: 8,
				children: [
					{
						label: 'News',
						value: 8,
						link: 'https://example.com/category/news/',
						children: null,
					},
				],
			},
		],
	},
];

const reportParams: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

describe( 'usePostsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsTopPosts.mockReset();
		mockUseStatsArchives.mockReset();
		mockUseStatsTopPosts.mockReturnValue( {
			comparisonRows: { rows: postRows, hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsTopPosts > );
		mockUseStatsArchives.mockReturnValue( {
			comparisonRows: { rows: archiveRows, hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsArchives > );
	} );

	it( 'requests all summarized rows for the selected range', () => {
		const paramsWithStaleChartPeriod = { ...reportParams, period: 'month' as const };
		const { result } = renderHook( () =>
			usePostsReportRecords( 'posts-pages', paramsWithStaleChartPeriod )
		);
		const expectedParams = {
			...paramsWithStaleChartPeriod,
			max: 0,
			period: 'day',
			summarize: 1,
			skip_archives: 1,
		};

		expect( mockUseStatsTopPosts ).toHaveBeenLastCalledWith( expectedParams, { enabled: true } );
		expect( mockUseStatsArchives ).toHaveBeenLastCalledWith( expectedParams, { enabled: false } );
		expect( result.current.posts.rows ).toEqual( postRows );
	} );

	it( 'preserves merged comparison views for posts', () => {
		mockUseStatsTopPosts.mockReturnValue( {
			comparisonRows: {
				rows: [ { ...postRows[ 0 ], previousViews: 10 } ],
				hasComparison: true,
			},
			hasComparison: true,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsTopPosts > );

		const { result } = renderHook( () =>
			usePostsReportRecords( 'posts-pages', {
				...reportParams,
				comp: '1',
				compare_from: '2026-07-07',
				compare_to: '2026-07-08',
			} )
		);

		expect( result.current.posts.rows[ 0 ] ).toEqual(
			expect.objectContaining( { views: 13, previousViews: 10 } )
		);
		expect( result.current.posts.hasComparison ).toBe( true );
	} );

	it( 'preserves the archive hierarchy and comparison views', () => {
		const comparedArchives: StatsArchivesComparisonItem[] = [
			{
				...archiveRows[ 0 ],
				children: [
					{
						...archiveRows[ 0 ].children?.[ 0 ],
						label: 'category',
						value: 8,
						children: [
							{
								label: 'News',
								value: 8,
								previousValue: 5,
								link: 'https://example.com/category/news/',
								children: null,
							},
						],
					},
				],
			},
		];
		mockUseStatsArchives.mockReturnValue( {
			comparisonRows: { rows: comparedArchives, hasComparison: true },
			hasComparison: true,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsArchives > );

		const { result } = renderHook( () => usePostsReportRecords( 'archives', reportParams ) );

		expect( result.current.archives.rows ).toEqual( [
			{
				id: 'tax-0',
				label: 'Taxonomies',
				views: 8,
				isGroup: true,
			},
			{
				id: 'tax-0-0',
				parentId: 'tax-0',
				label: 'Category',
				views: 8,
				isGroup: true,
			},
			{
				id: 'tax-0-0-0',
				parentId: 'tax-0-0',
				label: 'News',
				views: 8,
				previousViews: 5,
				link: 'https://example.com/category/news/',
				isGroup: false,
			},
		] );
		expect( result.current.archives.hasComparison ).toBe( true );
	} );

	it( 'surfaces error and refetch from the active report', () => {
		const refetch = jest.fn();
		mockUseStatsArchives.mockReturnValue( {
			comparisonRows: { rows: [], hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			isError: true,
			refetch,
		} as unknown as ReturnType< typeof useStatsArchives > );

		const { result } = renderHook( () => usePostsReportRecords( 'archives', reportParams ) );

		expect( result.current.isError ).toBe( true );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
