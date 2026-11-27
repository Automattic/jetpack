/**
 * External dependencies
 */
import { getDefaultQueryParams, useStatsTags } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useTagsReportRecords } from './use-report-records';
import type { StatsNormalizedReport, StatsTagsItem } from '@jetpack-premium-analytics/data';

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

const mockUseStatsTags = useStatsTags as jest.MockedFunction< typeof useStatsTags >;

const report: StatsNormalizedReport< StatsTagsItem > = {
	summary: {},
	data: [
		{
			time_interval: '',
			date_start: '',
			date_end: '',
			items: [
				{
					label: [
						{
							label: 'Recipes',
							type: 'category',
							labelIcon: 'folder',
							link: 'https://example.com/recipes/',
						},
					],
					labelText: 'Recipes',
					value: 1240,
					link: 'https://example.com/recipes/',
				},
				{
					label: [
						{
							label: 'vegan',
							type: 'tag',
							labelIcon: 'tag',
							link: 'https://example.com/tag/vegan/',
						},
					],
					labelText: 'vegan',
					value: 980,
					link: 'https://example.com/tag/vegan/',
				},
			],
		},
	],
};

describe( 'useTagsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsTags.mockReturnValue( {
			data: report,
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsTags > );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'requests the report window with more rows than the endpoint returns by default', () => {
		const reportParams = getDefaultQueryParams();
		renderHook( () => useTagsReportRecords( reportParams ) );

		expect( mockUseStatsTags ).toHaveBeenCalledWith( { ...reportParams, max: 1000 } );
	} );

	it.each( [
		[ undefined, [ 'Recipes', 'vegan' ] ],
		[ 'tag', [ 'vegan' ] ],
		[ 'category', [ 'Recipes' ] ],
	] as const )( 'returns the %s rows', ( termType, labels ) => {
		const { result } = renderHook( () =>
			useTagsReportRecords( getDefaultQueryParams(), termType )
		);

		expect( result.current.rows.map( row => row.labelText ) ).toEqual( labels );
	} );
} );
