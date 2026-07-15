import {
	fetchAllStatsCommentFollowers,
	statsCommentFollowersAllPagesQuery,
} from '../use-stats-comment-followers';
import type { StatsCommentFollowersResponse } from '../../queries/stats-comment-followers-query';

function createReport(
	page: number,
	pages: number | undefined,
	total = ( pages ?? 1 ) * 20
): StatsCommentFollowersResponse {
	return {
		summary: { page, pages, total },
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

	it( 'derives the page count from total when pages is missing', async () => {
		const reports = [
			createReport( 1, undefined, 41 ),
			createReport( 2, undefined, 41 ),
			createReport( 3, undefined, 41 ),
		];
		const fetchQuery = jest
			.fn()
			.mockResolvedValueOnce( reports[ 0 ] )
			.mockResolvedValueOnce( reports[ 1 ] )
			.mockResolvedValueOnce( reports[ 2 ] );

		await expect( fetchAllStatsCommentFollowers( { fetchQuery } as never ) ).resolves.toEqual(
			reports
		);
		expect( fetchQuery ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'limits concurrent page requests', async () => {
		let activeRequests = 0;
		let maxActiveRequests = 0;
		const fetchQuery = jest.fn( async query => {
			const params = query.queryKey[ 5 ] as { page: number };

			if ( params.page === 1 ) {
				return createReport( 1, 7 );
			}

			activeRequests += 1;
			maxActiveRequests = Math.max( maxActiveRequests, activeRequests );
			await new Promise( resolve => setTimeout( resolve, 0 ) );
			activeRequests -= 1;

			return createReport( params.page, 7 );
		} );

		await fetchAllStatsCommentFollowers( { fetchQuery } as never );

		expect( maxActiveRequests ).toBe( 4 );
		expect( fetchQuery ).toHaveBeenCalledTimes( 7 );
	} );
} );
