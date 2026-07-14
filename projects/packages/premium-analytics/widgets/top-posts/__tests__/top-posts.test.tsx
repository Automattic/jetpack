/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import TopPostsWidget from '../render';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	Link: ( { to, params, search, children, ...props }: MockRouteLinkProps ) => {
		// Interpolate `$name` path segments from `params`, mirroring the router,
		// so a param route like `/reports/$report` resolves to `/reports/posts`.
		const path = Object.entries( params ?? {} ).reduce(
			( acc, [ key, value ] ) => acc.replace( `$${ key }`, String( value ) ),
			to
		);
		const query = new URLSearchParams();
		Object.entries( search ?? {} ).forEach( ( [ key, value ] ) => {
			if ( value !== undefined && value !== null ) {
				query.set( key, String( value ) );
			}
		} );
		const queryString = query.toString();

		return (
			<a href={ queryString ? `${ path }?${ queryString }` : path } { ...props }>
				{ children }
			</a>
		);
	},
	useSearch: () => ( {} ),
} ) );

const mockGetScriptData = getScriptData as jest.Mock;
const mockApiFetch = apiFetch as unknown as jest.Mock;

function DashboardWidgetChromeFixture( { children }: { children: ReactNode } ) {
	return (
		<section aria-labelledby="top-posts-widget-title">
			<div>
				<div id="top-posts-widget-title">Top pages by views</div>
				<div>
					<div data-testid="widget-toolbar">
						<button type="button">Widget settings</button>
					</div>
				</div>
			</div>
			{ children }
		</section>
	);
}

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
		mockGetScriptData.mockReturnValue( {
			premium_analytics: { client_side_csv_exports_enabled: true },
		} );
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( TOP_POSTS_RESPONSE );
	} );

	it( 'links titles to the post-detail page and appends an external link icon', async () => {
		render( <TopPostsWidget attributes={ { num: 10 } } /> );

		// The title links to the internal analytics post-detail route (the SPA
		// path rides in the `p` query param), in the same tab.
		const titleLink = await screen.findByRole( 'link', { name: /^Hello World Post$/ } );
		expect( titleLink ).toHaveAttribute( 'href', expect.stringContaining( 'p=%2Fpost%2F1' ) );

		// The trailing icon opens the public page in a new tab.
		const externalLink = screen.getByRole( 'link', {
			name: /open hello world post in a new tab/i,
		} );
		expect( externalLink ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );

		expect( screen.getByText( 'About Page' ) ).toBeInTheDocument();
	} );

	it( 'requests the dashboard date range from report params', async () => {
		render(
			<TopPostsWidget
				attributes={ { num: 10, reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
			/>
		);

		await expect(
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
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

	it( 'links to the Posts & Pages report', () => {
		render( <TopPostsWidget attributes={ { num: 10 } } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/posts' )
		);
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
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
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
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
		).resolves.toBeInTheDocument();
		// No fabricated per-row delta from placeholder zeros.
		expect( screen.queryByText( /%/ ) ).not.toBeInTheDocument();
	} );

	it( 'exposes the CSV export in the widget content once the fetched rows are on screen', async () => {
		render(
			<DashboardWidgetChromeFixture>
				<TopPostsWidget attributes={ { num: 10 } } />
			</DashboardWidgetChromeFixture>
		);

		await expect(
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
		).resolves.toBeInTheDocument();

		const toolbar = screen.getByTestId( 'widget-toolbar' );
		expect(
			within( toolbar ).queryByRole( 'button', { name: /Download CSV/ } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toBeInTheDocument();
	} );

	it( 'hides the CSV export when the server flag is disabled', async () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: { client_side_csv_exports_enabled: false },
		} );

		render( <TopPostsWidget attributes={ { num: 10 } } /> );

		await expect(
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'hides the export while a new date range is still fetching, then restores it', async () => {
		// Hold the second range's fetch open so we can observe the in-flight
		// window. During it the stats query keeps the prior period's rows as
		// placeholder data, so `rows.length > 0` stays true while `isFetching`
		// is true. That is the exact state that used to let stale rows download
		// under the new-period filename.
		let resolveSecond: ( value: unknown ) => void = () => {};
		const secondFetch = new Promise( resolve => {
			resolveSecond = resolve;
		} );
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.includes( 'start_date=2026-05-01' ) ? secondFetch : Promise.resolve( TOP_POSTS_RESPONSE )
		);

		const { rerender } = render(
			<DashboardWidgetChromeFixture>
				<TopPostsWidget
					attributes={ {
						num: 10,
						reportParams: { from: '2026-03-01', to: '2026-03-10' },
					} }
				/>
			</DashboardWidgetChromeFixture>
		);

		// First range settles: rows and the export are both present.
		await expect(
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toBeInTheDocument();

		// Switch date range on the same tree; the new fetch is still pending.
		rerender(
			<DashboardWidgetChromeFixture>
				<TopPostsWidget
					attributes={ {
						num: 10,
						reportParams: { from: '2026-05-01', to: '2026-05-10' },
					} }
				/>
			</DashboardWidgetChromeFixture>
		);

		// Placeholder data keeps the prior rows visible, but the export must be
		// gated off while the active query is fetching.
		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument()
		);
		expect( screen.getByRole( 'link', { name: /^Hello World Post$/ } ) ).toBeInTheDocument();

		// Once the new range settles, the export returns.
		resolveSecond( TOP_POSTS_RESPONSE );
		await expect(
			screen.findByRole( 'button', { name: /Download CSV/ } )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders a delta when an overlapping comparison row has zero views', async () => {
		const zeroComparisonResponse = {
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
						views: 0,
					},
				],
				total_views: 0,
			},
		};
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-02-10' ) ? zeroComparisonResponse : TOP_POSTS_RESPONSE
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
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( '+100%' ) ).toBeInTheDocument();
	} );

	it( 'renders a placeholder instead of a fabricated delta for unmatched rows', async () => {
		// Only one post overlaps the comparison period; the other must show the
		// chart's placeholder, not a fabricated +100%.
		const partialComparison = {
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
						views: 21,
					},
				],
				total_views: 21,
			},
		};
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.includes( 'date=2026-02-10' ) ? partialComparison : TOP_POSTS_RESPONSE )
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
			screen.findByRole( 'link', { name: /^Hello World Post$/ } )
		).resolves.toBeInTheDocument();
		// Matched row: real delta (42 vs 21 → +100%). Unmatched row: placeholder.
		expect( screen.getByText( /100%/ ) ).toBeInTheDocument();
		expect( screen.getByText( '-' ) ).toBeInTheDocument();
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

		// Child rows are individual archive pages: titles are not clickable, and
		// the trailing icon links out to the archive page.
		await expect( screen.findByText( 'pricing' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /^pricing$/ } ) ).not.toBeInTheDocument();
		const termLink = screen.getByRole( 'link', { name: /open pricing in a new tab/i } );
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

		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /^News$/ } ) ).not.toBeInTheDocument();
		const termLink = screen.getByRole( 'link', { name: /open news in a new tab/i } );
		expect( termLink ).toHaveAttribute( 'href', 'https://example.com/category/news/' );
	} );
} );
