/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { captureCsvDownloads } from '../../test-utils';
import AuthorTopPostsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const DEFAULT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

const WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-07-01T00:00:00.000+00:00',
	to: '2026-07-07T23:59:59.999+00:00',
	author_id: 7,
};

// Summarized `stats/top-authors`: this author's posts arrive ranked already.
const TOP_AUTHORS_SUMMARY = {
	date: '2026-07-07',
	period: 'day',
	summary: {
		authors: [
			{
				name: 'Other',
				author_id: 3,
				views: 90,
				posts: [ { id: 9, title: 'Not hers', url: 'https://example.com/not-hers/', views: 90 } ],
			},
			{
				name: 'Priya',
				author_id: 7,
				views: 30,
				posts: [
					{ id: 1, title: 'Top post', url: 'https://example.com/top/', views: 20 },
					{ id: 2, title: 'Second post', url: 'https://example.com/second/', views: 10 },
					...Array.from( { length: 10 }, ( _, index ) => ( {
						id: 10 + index,
						title: `Older post ${ index }`,
						url: `https://example.com/older-${ index }/`,
						views: 9 - index,
					} ) ),
				],
			},
		],
	},
};

describe( 'AuthorTopPostsWidget', () => {
	let downloads: ReturnType< typeof captureCsvDownloads > | undefined;

	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	afterEach( () => {
		downloads?.restore();
		downloads = undefined;
	} );

	it( 'lists only this author’s posts, linked to their detail pages on the window', async () => {
		mockApiFetch.mockResolvedValue( TOP_AUTHORS_SUMMARY );

		render( <AuthorTopPostsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const top = await screen.findByRole( 'link', { name: 'Top post' } );
		expect( top ).toHaveAttribute(
			'href',
			expect.stringMatching( /^\/post\/1\?from=2026-07-01.*to=2026-07-07/ )
		);
		expect( screen.getByRole( 'link', { name: 'Second post' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Not hers' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringMatching( /^\/reports\/authors\?/ )
		);

		const requestedPath = decodeURIComponent( mockApiFetch.mock.calls[ 0 ][ 0 ].path as string );
		expect( requestedPath ).toContain( 'stats/top-authors' );
		expect( requestedPath ).toContain( 'max=0' );
	} );

	it( 'shows the generic empty state for an author missing from the period', async () => {
		mockApiFetch.mockResolvedValue( TOP_AUTHORS_SUMMARY );

		render(
			<AuthorTopPostsWidget attributes={ { reportParams: { ...WINDOW_PARAMS, author_id: 42 } } } />
		);

		await expect(
			screen.findByText( 'We couldn’t find results for this time period.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'renders the scopeless empty state and makes no request without an author scope', async () => {
		render( <AuthorTopPostsWidget attributes={ { reportParams: DEFAULT_PARAMS } } /> );

		await expect(
			screen.findByText( 'Open an author to see their top posts here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'downloads every one of this author’s posts from the report it already loaded', async () => {
		downloads = captureCsvDownloads();
		mockApiFetch.mockResolvedValue( TOP_AUTHORS_SUMMARY );

		render( <AuthorTopPostsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );
		await downloads.clickAndSave( await screen.findByRole( 'button', { name: /Download CSV/ } ) );

		const [ saved ] = downloads.files;
		const lines = await downloads.lines();

		expect( screen.queryByText( 'Older post 9' ) ).not.toBeInTheDocument();
		expect( saved.filename ).toBe( 'author-priya-posts-2026-07-01_2026-07-07.csv' );
		expect( lines ).toHaveLength( 13 );
		expect( lines[ 0 ] ).toBe( '"Title","Views","URL"' );
		expect( lines.join( '\n' ) ).toContain( 'Older post 9' );
		expect( lines.join( '\n' ) ).not.toContain( 'Not hers' );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the download when only the comparison request fails', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			decodeURIComponent( path ).includes( '2026-06' )
				? Promise.reject( { status: 403, code: 'forbidden' } )
				: Promise.resolve( TOP_AUTHORS_SUMMARY )
		);

		render(
			<AuthorTopPostsWidget
				attributes={ {
					reportParams: {
						...WINDOW_PARAMS,
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+00:00',
						compare_to: '2026-06-30T23:59:59.999+00:00',
					},
				} }
			/>
		);

		await expect(
			screen.findByRole( 'button', { name: /Download CSV/ } )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( '2026-06' ) } )
		);
	} );

	it( 'routes a permission-gated 403 through describeError: neutral copy, no retry', async () => {
		mockApiFetch.mockRejectedValue( { error: 'unauthorized', status: 403 } );

		render( <AuthorTopPostsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'refetches from the Retry action for a failure that can heal', async () => {
		// The proxy's `no_connection` 403 heals on reconnect and skips React Query's retry backoff.
		mockApiFetch.mockRejectedValue( { status: 403, code: 'no_connection' } );

		render( <AuthorTopPostsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "We couldn't load this author's posts. Please try again in a moment." )
		).resolves.toBeInTheDocument();

		mockApiFetch.mockResolvedValue( TOP_AUTHORS_SUMMARY );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		await expect( screen.findByRole( 'link', { name: 'Top post' } ) ).resolves.toBeInTheDocument();
	} );
} );
