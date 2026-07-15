/**
 * External dependencies
 */
import { useStatsCommentFollowersAllPages } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useCommentFollowersReportRecords } from './use-report-records';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsCommentFollowersAllPages: jest.fn(),
} ) );

const useAllPagesMock = jest.mocked( useStatsCommentFollowersAllPages );

describe( 'useCommentFollowersReportRecords', () => {
	it( 'separates the All Posts summary from post rows', () => {
		const refetch = jest.fn();
		useAllPagesMock.mockReturnValue( {
			data: [
				{
					summary: { page: 1, pages: 2, total: 3 },
					data: [
						{
							period: null,
							items: [ { id: 0, followers: 20 }, { id: 1 }, { id: 2 } ],
						},
					],
				},
			],
			isLoading: false,
			isError: false,
			refetch,
		} as never );

		const { result } = renderHook( () => useCommentFollowersReportRecords() );

		expect( result.current.rows ).toEqual( [ { id: 1 }, { id: 2 } ] );
		expect( result.current.allPostsFollowers ).toBe( 20 );
		expect( result.current.isError ).toBe( false );
		expect( result.current.refetch ).toBe( refetch );
	} );

	it( 'exposes query failures instead of treating them as empty data', () => {
		useAllPagesMock.mockReturnValue( {
			data: undefined,
			isLoading: false,
			isError: true,
			refetch: jest.fn(),
		} as never );

		const { result } = renderHook( () => useCommentFollowersReportRecords() );

		expect( result.current.rows ).toEqual( [] );
		expect( result.current.isError ).toBe( true );
	} );
} );
