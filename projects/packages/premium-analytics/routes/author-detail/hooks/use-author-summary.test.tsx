import { useStatsQuery } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useAuthorSummary } from './use-author-summary';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	authorSummaryQuery: jest.fn( ( authorId: number ) => ( {
		queryKey: [ 'author-summary', authorId ],
	} ) ),
	useStatsQuery: jest.fn(),
} ) );

const mockUseStatsQuery = useStatsQuery as jest.Mock;
const refetch = jest.fn();

/**
 * Stubs the summary query result, defaulting to a resolved author.
 *
 * @param overrides - Fields to override on the default query result.
 */
function mockQuery( overrides: Record< string, unknown > = {} ) {
	mockUseStatsQuery.mockReturnValue( {
		data: {
			id: 7,
			name: 'Priya Patel',
			avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=96',
			postCount: 4,
			firstPublishedDate: '2023-07-04T10:00:00',
		},
		isLoading: false,
		isError: false,
		isSuccess: true,
		refetch,
		...overrides,
	} );
}

describe( 'useAuthorSummary', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'exposes the resolved author', () => {
		mockQuery();

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current ).toMatchObject( {
			name: 'Priya Patel',
			avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=96',
			postCount: 4,
			firstPublishedDate: '2023-07-04T10:00:00',
			isLoading: false,
			isError: false,
			isNotFound: false,
		} );
		expect( mockUseStatsQuery ).toHaveBeenCalledWith( { queryKey: [ 'author-summary', 7 ] } );
	} );

	it( 'treats a null resolution as not found', () => {
		mockQuery( { data: null } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current.isNotFound ).toBe( true );
		expect( result.current.name ).toBeUndefined();
	} );

	it( 'is neither found nor missing while loading or after an error', () => {
		mockQuery( { data: undefined, isLoading: true, isSuccess: false } );
		expect( renderHook( () => useAuthorSummary( 7 ) ).result.current.isNotFound ).toBe( false );

		mockQuery( { data: undefined, isError: true, isSuccess: false } );
		const { result } = renderHook( () => useAuthorSummary( 7 ) );
		expect( result.current.isNotFound ).toBe( false );
		expect( result.current.isError ).toBe( true );
	} );

	it.each( [
		[ 'javascript:alert(1)', undefined ],
		[ 'http://example.com/a.png', 'http://example.com/a.png' ],
		[ '', undefined ],
	] )( 'passes only an http(s) avatar through (%p)', ( avatarUrl, expected ) => {
		mockQuery( { data: { id: 7, name: 'P', avatarUrl, postCount: 0, firstPublishedDate: '' } } );

		const { result } = renderHook( () => useAuthorSummary( 7 ) );

		expect( result.current.avatarUrl ).toBe( expected );
		expect( result.current.firstPublishedDate ).toBeUndefined();
	} );

	it( 'wraps refetch so it can be passed straight to a click handler', () => {
		mockQuery();

		const { result } = renderHook( () => useAuthorSummary( 7 ) );
		result.current.refetch();

		expect( refetch ).toHaveBeenCalledWith();
	} );
} );
