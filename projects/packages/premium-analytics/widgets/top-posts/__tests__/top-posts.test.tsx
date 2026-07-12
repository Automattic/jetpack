/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import TopPostsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// The widget requests a multi-day window, so the stats query layer summarizes
// the views into the top-level `summary` bucket rather than per-day `days`
// buckets.
const TOP_POSTS_RESPONSE = {
	date: '2026-06-10',
	days: {},
	summary: {
		postviews: [
			{
				id: 1,
				href: 'https://example.com/hello-world/',
				date: '2026-06-01',
				title: 'Hello World Post',
				type: 'post',
				views: 42,
			},
			{
				id: 2,
				href: 'https://example.com/about/',
				date: null,
				title: 'About Page',
				type: 'page',
				views: 7,
			},
		],
		total_views: 49,
	},
};

describe( 'TopPostsWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( TOP_POSTS_RESPONSE );
	} );

	it( 'renders the fetched top posts as links', async () => {
		render( <TopPostsWidget attributes={ { num: 10 } } /> );

		// The `@wordpress/ui` `Link` appends an "(opens in a new tab)" indicator
		// to the accessible name, so match the title as a substring.
		const link = await screen.findByRole( 'link', { name: /Hello World Post/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );
		expect( screen.getByText( 'About Page' ) ).toBeInTheDocument();
	} );

	it( 'filters rows by post type when the postType attribute is set', async () => {
		render( <TopPostsWidget attributes={ { num: 10, postType: 'page' } } /> );

		await expect( screen.findByText( 'About Page' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Hello World Post' ) ).not.toBeInTheDocument();
	} );

	it( 'requests the dashboard date range from report params', async () => {
		render(
			<TopPostsWidget
				attributes={ { num: 10, reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
			/>
		);

		await expect(
			screen.findByRole( 'link', { name: /Hello World Post/ } )
		).resolves.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'start_date=2026-03-01' );
		expect( requestedPath ).toContain( 'date=2026-03-10' );
	} );

	it( 'requests the comparison window and aligns previous views by post URL', async () => {
		// Same post across both periods so the primary row can pick up a
		// previous value; keyed by URL, not order.
		const comparisonResponse = {
			date: '2026-02-10',
			days: {},
			summary: {
				postviews: [
					{
						id: 1,
						href: 'https://example.com/hello-world/',
						date: '2026-02-01',
						title: 'Hello World Post',
						type: 'post',
						views: 20,
					},
				],
				total_views: 20,
			},
		};
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-02-10' ) ? comparisonResponse : TOP_POSTS_RESPONSE
			)
		);

		render(
			<TopPostsWidget
				attributes={ {
					num: 10,
					reportParams: {
						from: '2026-03-01',
						to: '2026-03-10',
						comp: '1',
						compare_from: '2026-02-01',
						compare_to: '2026-02-10',
					},
				} }
			/>
		);

		await expect(
			screen.findByRole( 'link', { name: /Hello World Post/ } )
		).resolves.toBeInTheDocument();

		const requestedPaths = mockApiFetch.mock.calls.map(
			( [ { path } ]: [ { path: string } ] ) => path
		);
		expect(
			requestedPaths.some(
				p => p.includes( 'start_date=2026-03-01' ) && p.includes( 'date=2026-03-10' )
			)
		).toBe( true );
		expect(
			requestedPaths.some(
				p => p.includes( 'start_date=2026-02-01' ) && p.includes( 'date=2026-02-10' )
			)
		).toBe( true );
	} );

	it( 'does not render deltas when the comparison period has no overlapping posts', async () => {
		// Comparison returns rows, but for a different post — so no primary row
		// has a previous value and the comparison UI must stay off.
		const nonOverlappingComparison = {
			date: '2026-02-10',
			days: {},
			summary: {
				postviews: [
					{
						id: 9,
						href: 'https://example.com/unrelated/',
						date: '2026-02-01',
						title: 'Unrelated Post',
						type: 'post',
						views: 99,
					},
				],
				total_views: 99,
			},
		};
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-02-10' ) ? nonOverlappingComparison : TOP_POSTS_RESPONSE
			)
		);

		render(
			<TopPostsWidget
				attributes={ {
					num: 10,
					reportParams: {
						from: '2026-03-01',
						to: '2026-03-10',
						comp: '1',
						compare_from: '2026-02-01',
						compare_to: '2026-02-10',
					},
				} }
			/>
		);

		await expect(
			screen.findByRole( 'link', { name: /Hello World Post/ } )
		).resolves.toBeInTheDocument();
		// No fabricated per-row delta from placeholder zeros.
		expect( screen.queryByText( /%/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders the empty state when there are no views', async () => {
		mockApiFetch.mockResolvedValue( { date: '2026-06-10', days: {} } );

		render( <TopPostsWidget attributes={ { num: 10 } } /> );

		await expect( screen.findByText( 'No views in this period.' ) ).resolves.toBeInTheDocument();
	} );
} );
