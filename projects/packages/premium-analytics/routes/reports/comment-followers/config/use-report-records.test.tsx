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
	it( 'combines rows from every endpoint page', () => {
		useAllPagesMock.mockReturnValue( {
			data: [
				{
					summary: { page: 1, pages: 2, total: 2 },
					data: [ { period: null, items: [ { id: 1 }, { id: 2 } ] } ],
				},
			],
			isLoading: false,
			isError: false,
		} as never );

		const { result } = renderHook( () => useCommentFollowersReportRecords() );

		expect( result.current.rows ).toEqual( [ { id: 1 }, { id: 2 } ] );
		expect( result.current.isError ).toBe( false );
	} );

	it( 'exposes query failures instead of treating them as empty data', () => {
		useAllPagesMock.mockReturnValue( {
			data: undefined,
			isLoading: false,
			isError: true,
		} as never );

		const { result } = renderHook( () => useCommentFollowersReportRecords() );

		expect( result.current.rows ).toEqual( [] );
		expect( result.current.isError ).toBe( true );
	} );
} );
