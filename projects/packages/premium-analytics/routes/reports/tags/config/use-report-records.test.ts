/**
 * External dependencies
 */
import { useStatsTags } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useTagsReportRecords } from './use-report-records';
import type { StatsNormalizedReport, StatsTagsItem } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsTags: jest.fn(),
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
						{ label: 'Recipes', labelIcon: 'folder', link: 'https://example.com/recipes/' },
					],
					labelText: 'Recipes',
					value: 1240,
					link: 'https://example.com/recipes/',
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

	it( 'requests more rows than the endpoint would return by default', () => {
		renderHook( () => useTagsReportRecords() );

		expect( mockUseStatsTags ).toHaveBeenCalledWith( { max: 1000 } );
	} );

	it( 'returns the normalized rows', () => {
		const { result } = renderHook( () => useTagsReportRecords() );

		expect( result.current.rows ).toEqual( [
			expect.objectContaining( { labelText: 'Recipes', value: 1240 } ),
		] );
	} );
} );
