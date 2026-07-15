import {
	fetchAllStatsCommentFollowers,
	statsCommentFollowersAllPagesQuery,
} from '../use-stats-comment-followers';
import type { StatsCommentFollowersResponse } from '../../queries/stats-comment-followers-query';

function createReport( page: number, pages: number ): StatsCommentFollowersResponse {
	return {
		summary: { page, pages, total: pages * 20 },
		data: [],
	};
}

describe( 'fetchAllStatsCommentFollowers', () => {
	it( 'leaves retries to the individual page queries', () => {
		expect( statsCommentFollowersAllPagesQuery().retry ).toBe( false );
	} );

	it( 'fetches every server-side page with the endpoint maximum', async () => {
		const reports = [ createReport( 1, 3 ), createReport( 2, 3 ), createReport( 3, 3 ) ];
		const fetchQuery = jest
			.fn()
			.mockResolvedValueOnce( reports[ 0 ] )
			.mockResolvedValueOnce( reports[ 1 ] )
			.mockResolvedValueOnce( reports[ 2 ] );

		await expect( fetchAllStatsCommentFollowers( { fetchQuery } as never ) ).resolves.toEqual(
			reports
		);
		expect( fetchQuery ).toHaveBeenCalledTimes( 3 );
		expect( fetchQuery.mock.calls.map( ( [ query ] ) => query.queryKey[ 5 ] ) ).toEqual( [
			{ max: 20, page: 1 },
			{ max: 20, page: 2 },
			{ max: 20, page: 3 },
		] );
	} );

	it( 'stops after the first request for a single-page response', async () => {
		const report = createReport( 1, 1 );
		const fetchQuery = jest.fn().mockResolvedValue( report );

		await expect( fetchAllStatsCommentFollowers( { fetchQuery } as never ) ).resolves.toEqual( [
			report,
		] );
		expect( fetchQuery ).toHaveBeenCalledTimes( 1 );
	} );
} );
