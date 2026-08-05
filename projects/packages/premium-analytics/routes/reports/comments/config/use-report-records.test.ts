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

/**
 * Build a one-post report carrying the given link.
 *
 * @param link      - The post link the API returns.
 * @param overrides - Fields to override on the post item.
 * @return The report response.
 */
function withPostLink(
	link: string,
	overrides: Record< string, unknown > = {}
): StatsCommentsResponse {
	const group = report.data[ 0 ].items[ 0 ] as { children: unknown[] };

	return {
		...report,
		data: [
			{
				...report.data[ 0 ],
				items: [
					{
						...( report.data[ 0 ].items[ 0 ] as object ),
						children: [ { ...( group.children[ 0 ] as object ), link, ...overrides } ],
					},
				],
			},
		],
	} as StatsCommentsResponse;
}

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

	it( 'drops a post link that is not a safe http(s) URL, keeping the row', () => {
		mockUseStatsComments.mockReturnValue( {
			data: withPostLink( 'javascript:alert(1)' ),
			isLoading: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsComments > );

		const { result } = renderHook( () => useCommentsReportRecords( 'posts' ) );

		expect( result.current.rows ).toEqual( [
			expect.objectContaining( { label: 'Hello world', value: 12, link: undefined } ),
		] );
	} );

	// A post with no id keys its row on the raw link, so the guard must not disturb identity.
	it( 'keeps the raw link as the row id when the post has no id', () => {
		mockUseStatsComments.mockReturnValue( {
			data: withPostLink( 'javascript:alert(1)', { id: null } ),
			isLoading: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsComments > );

		const { result } = renderHook( () => useCommentsReportRecords( 'posts' ) );

		expect( result.current.rows ).toEqual( [
			expect.objectContaining( { id: 'javascript:alert(1)', link: undefined } ),
		] );
	} );
} );
