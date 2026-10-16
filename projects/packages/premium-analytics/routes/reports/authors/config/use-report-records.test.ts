/**
 * External dependencies
 */
import { useStatsTopAuthors } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useAuthorsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsTopAuthorsComparisonItem,
	StatsTopAuthorsItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsArchives: jest.fn(),
	useStatsClicks: jest.fn(),
	useStatsCommentFollowersAllPages: jest.fn(),
	useStatsComments: jest.fn(),
	useStatsFileDownloads: jest.fn(),
	useStatsLocations: jest.fn(),
	useStatsReferrers: jest.fn(),
	useStatsSearchTerms: jest.fn(),
	useStatsTags: jest.fn(),
	useStatsTopAuthors: jest.fn(),
	useStatsTopPosts: jest.fn(),
	useStatsUtm: jest.fn(),
	useStatsVideoPlays: jest.fn(),
} ) );

const mockUseStatsTopAuthors = useStatsTopAuthors as jest.MockedFunction<
	typeof useStatsTopAuthors
>;

const report: StatsNormalizedReport< StatsTopAuthorsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 7,
					icon: 'https://example.com/ada.png',
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
					label: 'Ada Lovelace',
					views: 6,
					icon: 'https://example.com/ada.png',
				},
			],
		},
	],
};

const mergedRows: StatsTopAuthorsComparisonItem[] = [
	{
		key: '42',
		id: 42,
		label: 'Ada Lovelace',
		views: 13,
		icon: 'https://example.com/ada.png',
	},
];

describe( 'useAuthorsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsTopAuthors.mockReset();
		mockUseStatsTopAuthors.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			comparisonRows: { rows: mergedRows, hasComparison: true },
			hasComparison: true,
			isLoading: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsTopAuthors > );
	} );

	it( 'uses the top-authors request from the Jetpack Stats Authors report', () => {
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};
		const { result } = renderHook( () => useAuthorsReportRecords( params ) );

		expect( mockUseStatsTopAuthors ).toHaveBeenLastCalledWith( {
			...params,
			max: 0,
		} );
		expect( result.current.rows ).toEqual( [
			expect.objectContaining( {
				id: 'id:42',
				label: 'Ada Lovelace',
				views: 13,
			} ),
		] );
		expect( result.current.isLoading ).toBe( false );
		expect( result.current.isError ).toBe( false );
		expect( result.current.hasComparison ).toBe( true );
	} );

	it( 'surfaces error and refetch from the report', () => {
		const refetch = jest.fn();
		mockUseStatsTopAuthors.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			comparisonRows: { rows: mergedRows, hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isError: true,
			refetch,
		} as unknown as ReturnType< typeof useStatsTopAuthors > );
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};

		const { result } = renderHook( () => useAuthorsReportRecords( params ) );

		expect( result.current.isError ).toBe( true );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
