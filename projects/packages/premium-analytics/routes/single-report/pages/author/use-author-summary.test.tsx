import { useStatsQuery } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useAuthorStats } from './use-author-stats';
import { useAuthorSummary } from './use-author-summary';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	authorPostsQuery: jest.fn( ( authorId: number ) => ( {
		queryKey: [ 'author-posts', authorId ],
	} ) ),
	useStatsQuery: jest.fn(),
} ) );

jest.mock( './use-author-stats', () => ( {
	...jest.requireActual( './use-author-stats' ),
	useAuthorStats: jest.fn(),
} ) );

const mockUseStatsQuery = useStatsQuery as jest.Mock;
const mockUseAuthorStats = useAuthorStats as jest.Mock;
const refetch = jest.fn();

/**
 * Stubs the stats and posts results, defaulting to a resolved author with posts.
 *
 * @param stats - Fields to override on the `stats/author` result.
 * @param posts - Fields to override on the posts query result.
 */
function mockQueries(
	stats: Record< string, unknown > = {},
	posts: Record< string, unknown > = {}
) {
	mockUseAuthorStats.mockReturnValue( {
		data: {
			isApproximate: false,
			report: {
				author: {
					id: 7,
					name: 'Priya Patel',
					avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=64&d=mm',
				},
				firstContentDate: '2023-07-04 10:00:00',
			},
		},
		isPlaceholderData: false,
		isLoading: false,
		isError: false,
		error: null,
		refetch,
		...stats,
	} );
	mockUseStatsQuery.mockReturnValue( {
		data: { postCount: 4 },
		isLoading: false,
		isError: false,
		...posts,
	} );
}

describe( 'useAuthorSummary', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'exposes the resolved author', () => {
		mockQueries();

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( {
			name: 'Priya Patel',
			avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=144&d=mm',
			postCount: 4,
			firstPublishedDate: '2023-07-04T10:00:00Z',
			isLoading: false,
			isError: false,
			isNotFound: false,
			isPostsLoading: false,
			isPostsError: false,
		} );
		expect( mockUseAuthorStats ).toHaveBeenCalledWith( 7 );
		expect( mockUseStatsQuery ).toHaveBeenCalledWith( { queryKey: [ 'author-posts', 7 ] } );
	} );

	it( 'treats an unknown author as not found, not as an error', () => {
		mockQueries( {
			data: undefined,
			isError: true,
			error: { error: 'unknown_author', status: 404 },
		} );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( {
			isNotFound: true,
			isError: false,
			error: null,
			name: undefined,
		} );
	} );

	it( 'reports a failure with no author to show as an error', () => {
		const error = { error: 'unauthorized', status: 403 };
		mockQueries( { data: undefined, isError: true, error } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( { isNotFound: false, isError: true, error } );
	} );

	it( 'keeps the author when a background refetch fails', () => {
		mockQueries( { isError: true, error: { status: 503 } } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( { name: 'Priya Patel', isError: false, error: null } );
	} );

	it( 'ignores another author held as placeholder data', () => {
		mockQueries( { isPlaceholderData: true, isLoading: true } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( { name: undefined, isLoading: true } );
	} );

	it( 'reports a posts failure on its own, leaving the identity intact', () => {
		mockQueries( {}, { data: undefined, isError: true } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( {
			name: 'Priya Patel',
			postCount: undefined,
			firstPublishedDate: '2023-07-04T10:00:00Z',
			isError: false,
			isPostsError: true,
		} );
	} );

	it.each( [
		[ 'javascript:alert(1)', undefined ],
		[ 'http://example.com/a.png', 'http://example.com/a.png' ],
		[ null, undefined ],
	] )( 'passes only an http(s) avatar through (%p)', ( avatarUrl, expected ) => {
		mockQueries(
			{
				data: {
					isApproximate: false,
					report: { author: { id: 7, name: 'P', avatarUrl }, firstContentDate: null },
				},
			},
			{ data: { postCount: 0 } }
		);

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current.avatarUrl ).toBe( expected );
		expect( result.current.firstPublishedDate ).toBeUndefined();
	} );

	it( 'keeps a click event out of the underlying refetch', () => {
		mockQueries();

		const { result } = renderHook( () => useAuthorSummary( 7 ) );
		( result.current.refetch as ( event: unknown ) => void )( { type: 'click' } );

		expect( refetch ).toHaveBeenCalledWith();
	} );
} );
