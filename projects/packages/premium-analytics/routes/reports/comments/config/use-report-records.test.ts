import { useStatsComments } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useCommentsReportRecords } from './use-report-records';
import type { StatsCommentsResponse } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsComments: jest.fn(),
} ) );

const mockUseStatsComments = useStatsComments as jest.MockedFunction< typeof useStatsComments >;

const report: StatsCommentsResponse = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-01',
			date_start: '2026-07-01T00:00:00+00:00',
			date_end: '2026-07-01T23:59:59+00:00',
			items: [
				{
					label: 'posts',
					value: 12,
					children: [
						{
							id: 42,
							label: 'Hello world',
							value: 12,
							link: 'https://example.com/hello-world/',
							page: null,
							actions: [],
							children: null,
						},
					],
				},
			],
		},
	],
};

describe( 'useCommentsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsComments.mockReturnValue( {
			data: report,
			isLoading: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsComments > );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'preserves the post id for post detail drill-through', () => {
		const { result } = renderHook( () => useCommentsReportRecords( 'posts' ) );

		expect( result.current.rows ).toEqual( [
			expect.objectContaining( {
				id: '42',
				label: 'Hello world',
				value: 12,
				link: 'https://example.com/hello-world/',
				postId: '42',
			} ),
		] );
	} );
} );
