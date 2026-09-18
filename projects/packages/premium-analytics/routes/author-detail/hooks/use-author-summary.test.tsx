import { useStatsQuery } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useAuthorSummary } from './use-author-summary';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	authorSummaryQuery: jest.fn( ( authorId: number ) => ( {
		queryKey: [ 'author-summary', authorId ],
	} ) ),
	authorPostsQuery: jest.fn( ( authorId: number ) => ( {
		queryKey: [ 'author-posts', authorId ],
	} ) ),
	useStatsQuery: jest.fn(),
} ) );

const mockUseStatsQuery = useStatsQuery as jest.Mock;
const refetch = jest.fn();

/**
 * Stubs both query results by key, defaulting to a resolved author with posts.
 *
 * @param summary - Fields to override on the identity query result.
 * @param posts   - Fields to override on the posts query result.
 */
function mockQueries(
	summary: Record< string, unknown > = {},
	posts: Record< string, unknown > = {}
) {
	mockUseStatsQuery.mockImplementation( ( { queryKey }: { queryKey: string[] } ) =>
		queryKey[ 0 ] === 'author-summary'
			? {
					data: {
						id: 7,
						name: 'Priya Patel',
						avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=96',
					},
					isLoading: false,
					isError: false,
					error: null,
					isSuccess: true,
					refetch,
					...summary,
			  }
			: {
					data: { postCount: 4, firstPublishedDate: '2023-07-04T10:00:00' },
					isLoading: false,
					isError: false,
					...posts,
			  }
	);
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
			avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=96',
			postCount: 4,
			firstPublishedDate: '2023-07-04T10:00:00',
			isLoading: false,
			isError: false,
			isNotFound: false,
			isPostsLoading: false,
			isPostsError: false,
		} );
		expect( mockUseStatsQuery ).toHaveBeenCalledWith( { queryKey: [ 'author-summary', 7 ] } );
		expect( mockUseStatsQuery ).toHaveBeenCalledWith( { queryKey: [ 'author-posts', 7 ] } );
	} );

	it( 'treats a null resolution as not found', () => {
		mockQueries( { data: null } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current.isNotFound ).toBe( true );
		expect( result.current.name ).toBeUndefined();
	} );

	it( 'is neither found nor missing while loading or after an error', () => {
		mockQueries( { data: undefined, isLoading: true, isSuccess: false } );
		expect( renderHook( () => useAuthorSummary( 7 ) ).result.current.isNotFound ).toBe( false );

		const error = { code: 'rest_forbidden', status: 403 };
		mockQueries( { data: undefined, isError: true, error, isSuccess: false } );
		const { result } = renderHook( () => useAuthorSummary( 7 ) );
		expect( result.current.isNotFound ).toBe( false );
		expect( result.current.isError ).toBe( true );
		expect( result.current.error ).toBe( error );
	} );

	it( 'reports a posts failure on its own, leaving the identity intact', () => {
		mockQueries( {}, { data: undefined, isError: true } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( {
			name: 'Priya Patel',
			postCount: undefined,
			firstPublishedDate: undefined,
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
			{ data: { id: 7, name: 'P', avatarUrl } },
			{ data: { postCount: 0, firstPublishedDate: null } }
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
