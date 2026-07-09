/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
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

	it( 'requests the dashboard date range from report params', async () => {
		render(
			<TopPostsWidget
				attributes={ { num: 10, reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
			/>
		);

		await expect(
			screen.findByRole( 'link', { name: /Hello World Post/ } )
		).resolves.toBeInTheDocument();

		const topPostsPath = mockApiFetch.mock.calls
			.map( ( [ { path } ]: [ { path: string } ] ) => path )
			.find( ( path: string ) => path.includes( 'top-posts' ) ) as string;
		expect( topPostsPath ).toContain( 'start_date=2026-03-01' );
		expect( topPostsPath ).toContain( 'date=2026-03-10' );
		// List reports are day-bucketed regardless of the dashboard chart interval,
		// and the post list excludes archive pages (they have their own view).
		expect( topPostsPath ).toContain( 'period=day' );
		expect( topPostsPath ).toContain( 'skip_archives=1' );
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

	it( 'caps the visible posts list at num including the homepage entry', async () => {
		// The API caps postviews at max but appends the homepage entry on top,
		// so the widget re-caps the ranked list client-side.
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-10',
			days: {},
			summary: {
				postviews: [
					...TOP_POSTS_RESPONSE.summary.postviews,
					{
						id: 0,
						href: null,
						date: null,
						title: 'Homepage (Latest posts)',
						type: 'homepage',
						views: 12,
					},
				],
				total_views: 61,
			},
		} );

		render( <TopPostsWidget attributes={ { num: 2 } } /> );

		// Ranked: Hello World Post (42), Homepage (12) — About Page (7) is cut.
		await expect( screen.findByText( 'Homepage (Latest posts)' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( /Hello World Post/ ) ).toBeInTheDocument();
		expect( screen.queryByText( 'About Page' ) ).not.toBeInTheDocument();
	} );

	it( 'renders aggregate archive rows when contentView is archives', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-10',
			summary: {
				home: [ { value: 'home', href: 'https://example.com/', views: '12' } ],
				search: [ { value: 'pricing', href: 'https://example.com/?s=pricing', views: '3' } ],
			},
		} );

		render( <TopPostsWidget attributes={ { num: 10, contentView: 'archives' } } /> );

		await expect( screen.findByText( 'Searches' ) ).resolves.toBeInTheDocument();
		// Aggregate rows have no URL, so they must not render as links.
		expect( screen.queryByRole( 'link', { name: /Searches/ } ) ).not.toBeInTheDocument();
		// The homepage entry belongs to the Posts & pages view, not Archives.
		expect( screen.queryByText( 'Homepage (Latest posts)' ) ).not.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'archives' );
		// Mirrors the Stats card: the same skip_archives=1 goes to both reports,
		// so the API keeps the homepage entry out of this one.
		expect( requestedPath ).toContain( 'skip_archives=1' );
	} );

	it( 'renders the homepage entry the API returns with skip_archives as an unlinked row', async () => {
		// With skip_archives=1 the API keeps the homepage-as-latest-posts entry
		// in postviews, titled by the server and without a URL.
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-10',
			days: {},
			summary: {
				postviews: [
					...TOP_POSTS_RESPONSE.summary.postviews,
					{
						id: 0,
						href: null,
						date: null,
						title: 'Homepage (Latest posts)',
						type: 'homepage',
						views: 12,
					},
				],
				total_views: 61,
			},
		} );

		render( <TopPostsWidget attributes={ { num: 10 } } /> );

		await expect( screen.findByText( 'Homepage (Latest posts)' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'About Page' ) ).toBeInTheDocument();
		// The homepage entry has no URL — it must not render as a link.
		expect( screen.queryByRole( 'link', { name: /Homepage/ } ) ).not.toBeInTheDocument();
	} );

	it( 'gates archive comparison UI on overlapping archive types', async () => {
		// Comparison period has archive views, but for a type absent from the
		// primary period — the comparison UI must stay off.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-02-10' )
					? {
							date: '2026-02-10',
							summary: {
								post_type: [
									{ value: 'post', href: 'https://example.com/type/post/', views: '9' },
								],
							},
					  }
					: {
							date: '2026-06-10',
							summary: {
								search: [ { value: 'pricing', href: 'https://example.com/?s=p', views: '12' } ],
							},
					  }
			)
		);

		render(
			<TopPostsWidget
				attributes={ {
					num: 10,
					contentView: 'archives',
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

		await expect( screen.findByText( 'Searches' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /%/ ) ).not.toBeInTheDocument();
	} );

	it( 'requests archive comparison data and renders deltas for overlapping types', async () => {
		// The same archive type exists in both periods, so the comparison UI is
		// on and the matched row shows a real delta.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-02-10' )
					? {
							date: '2026-02-10',
							summary: {
								search: [ { value: 'pricing', href: 'https://example.com/?s=p', views: '6' } ],
							},
					  }
					: {
							date: '2026-06-10',
							summary: {
								search: [ { value: 'pricing', href: 'https://example.com/?s=p', views: '12' } ],
							},
					  }
			)
		);

		render(
			<TopPostsWidget
				attributes={ {
					num: 10,
					contentView: 'archives',
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

		await expect( screen.findByText( 'Searches' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( /%/ ) ).toBeInTheDocument();

		// Both period windows were requested from the archives report.
		const requestedPaths = mockApiFetch.mock.calls.map(
			( [ { path } ]: [ { path: string } ] ) => path
		);
		expect(
			requestedPaths.some( p => p.includes( 'archives' ) && p.includes( 'start_date=2026-03-01' ) )
		).toBe( true );
		expect(
			requestedPaths.some( p => p.includes( 'archives' ) && p.includes( 'start_date=2026-02-01' ) )
		).toBe( true );
	} );

	it( 'treats num=0 as "all rows" in the archives view', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-10',
			summary: {
				search: [ { value: 'pricing', href: 'https://example.com/?s=p', views: '3' } ],
				post_type: [ { value: 'post', href: 'https://example.com/type/post/', views: '2' } ],
			},
		} );

		render( <TopPostsWidget attributes={ { num: 0, contentView: 'archives' } } /> );

		await expect( screen.findByText( 'Searches' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Post types' ) ).toBeInTheDocument();
	} );

	it( 'drills down from grouped archive rows and back', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-10',
			summary: {
				search: [
					{ value: 'pricing', href: 'https://example.com/?s=pricing', views: '3' },
					{ value: 'changelog', href: 'https://example.com/?s=changelog', views: '2' },
				],
			},
		} );

		render( <TopPostsWidget attributes={ { num: 10, contentView: 'archives' } } /> );

		const drillDownButton = await screen.findByRole( 'button', {
			name: /view searches archive pages/i,
		} );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( drillDownButton );

		// Child rows are individual archive pages linking to their URL.
		const termLink = await screen.findByRole( 'link', { name: /pricing/ } );
		expect( termLink ).toHaveAttribute( 'href', 'https://example.com/?s=pricing' );

		const backLink = screen.getByRole( 'button', { name: /back to the previous archive list/i } );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( backLink );

		await expect(
			screen.findByRole( 'button', { name: /view searches archive pages/i } )
		).resolves.toBeInTheDocument();
	} );

	it( 'drills two levels into taxonomy archives', async () => {
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-10',
			summary: {
				tax: {
					category: [ { value: 'News', href: 'https://example.com/category/news/', views: '5' } ],
				},
			},
		} );

		render( <TopPostsWidget attributes={ { num: 10, contentView: 'archives' } } /> );

		// Level 0 → taxonomy groups.
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click(
			await screen.findByRole( 'button', { name: /view taxonomies archive pages/i } )
		);
		// Level 1 → terms of the selected taxonomy.
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click(
			await screen.findByRole( 'button', { name: /view category archive pages/i } )
		);

		const termLink = await screen.findByRole( 'link', { name: /News/ } );
		expect( termLink ).toHaveAttribute( 'href', 'https://example.com/category/news/' );
	} );
} );
