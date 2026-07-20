import { useStatsArchives, useStatsTopPosts } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { usePostsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsArchives: jest.fn(),
	useStatsTopPosts: jest.fn(),
} ) );

const mockUseStatsArchives = useStatsArchives as jest.MockedFunction< typeof useStatsArchives >;
const mockUseStatsTopPosts = useStatsTopPosts as jest.MockedFunction< typeof useStatsTopPosts >;

const report: StatsNormalizedReport< StatsTopPostsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					id: 42,
					label: 'Post A',
					views: 7,
					link: 'https://example.com/post-a/',
					type: 'post',
				},
			],
		},
		{
			time_interval: '2026-07-10',
			date_start: '2026-07-10T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
			items: [
				{
					id: 42,
					label: 'Post A',
					views: 6,
					link: 'https://example.com/post-a/',
					type: 'post',
				},
			],
		},
	],
};

const params: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

describe( 'usePostsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsArchives.mockReset();
		mockUseStatsTopPosts.mockReset();
		mockUseStatsTopPosts.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsTopPosts > );
		mockUseStatsArchives.mockReturnValue( {
			primary: { data: undefined },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsArchives > );
	} );

	it( 'keeps both requests day-bucketed while grouping only the chart by week', () => {
		const dayResult = renderHook( () =>
			usePostsReportRecords( 'posts-pages', params, 'day' )
		).result;
		const weekResult = renderHook( () =>
			usePostsReportRecords( 'posts-pages', params, 'week' )
		).result;
		const expectedParams = {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
			skip_archives: 1,
		};

		expect( mockUseStatsTopPosts ).toHaveBeenLastCalledWith( expectedParams, { enabled: true } );
		expect( mockUseStatsArchives ).toHaveBeenLastCalledWith( expectedParams, { enabled: false } );
		expect( weekResult.current.chart.primary.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-06',
				value: 13,
				views: 13,
			} ),
		] );
		expect( weekResult.current.posts.rows ).toEqual( dayResult.current.posts.rows );
	} );
} );
