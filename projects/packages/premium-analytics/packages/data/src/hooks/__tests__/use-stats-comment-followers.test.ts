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

	it( 'stops fetching the remaining pages once one fails', async () => {
		const failure = new Error( 'Page 2 failed' );
		const fetchQuery = jest.fn( async query => {
			const { page } = query.queryKey[ 5 ] as { page: number };

			if ( page === 1 ) {
				return createReport( 1, 20 );
			}

			// Let every concurrent worker start before the first rejection lands,
			// so the test covers the queue draining rather than a single worker.
			await new Promise( resolve => setTimeout( resolve, 0 ) );

			if ( page === 2 ) {
				throw failure;
			}

			return createReport( page, 20 );
		} );

		await expect( fetchAllStatsCommentFollowers( { fetchQuery } as never ) ).rejects.toThrow(
			failure
		);

		// `Promise.all` rejects while the other workers are still running, so the
		// count has to settle before it means anything — asserting here is what
		// the bug itself looked like.
		await new Promise( resolve => setTimeout( resolve, 10 ) );

		// The first page plus one batch of concurrent workers — never all 20 pages.
		expect( fetchQuery.mock.calls.length ).toBeLessThanOrEqual( 5 );
	} );

	it( 'stops fetching the remaining pages once the signal aborts', async () => {
		const controller = new AbortController();
		const fetchQuery = jest.fn( async query => {
			const { page } = query.queryKey[ 5 ] as { page: number };

			if ( page === 1 ) {
				return createReport( 1, 20 );
			}

			controller.abort();
			await new Promise( resolve => setTimeout( resolve, 0 ) );

			return createReport( page, 20 );
		} );

		await fetchAllStatsCommentFollowers( { fetchQuery } as never, controller.signal );

		expect( fetchQuery.mock.calls.length ).toBeLessThanOrEqual( 5 );
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
