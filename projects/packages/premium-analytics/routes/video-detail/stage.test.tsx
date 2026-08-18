import { fireEvent, render, screen, within } from '@testing-library/react';
import { useVideoSummary } from './hooks';
import { stage } from './stage';
import type { ReactNode } from 'react';

let mockSearch: Record< string, unknown > = {};

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	// Spread the real module so the report registry's tab configs, which call
	// `defineReportTabs`, still resolve now that the registry is not mocked.
	// `buildReportLink` and `pickReportDateParams` stay real too, so the link
	// assertions below exercise the code that builds the href in product.
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
	useReportDateFilters: () => ( {
		appliedRange: { from: new Date( 2026, 5, 1 ), to: new Date( 2026, 5, 16 ) },
	} ),
} ) );

// Avoid loading DataViews while keeping the real breadcrumbs for these assertions.
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: ( { showComparison }: { showComparison?: boolean } ) => (
		<div>{ showComparison === false ? 'Date filters without comparison' : 'Date filters' }</div>
	),
	StatsBreadcrumbs: jest.requireActual( '../../packages/ui/src/stats-breadcrumbs' )
		.StatsBreadcrumbs,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Falls through to the real module for everything but `useSelect`. Reaching the
// externals passthrough pulls `@wordpress/components` -> `@wordpress/rich-text`
// into the graph, whose store calls `combineReducers` at import time; a
// `useSelect`-only mock leaves that undefined and the suite fails to load.
// `requireActual` has to stay lazy — calling it in the factory body re-enters
// the module while it is still initialising.
jest.mock(
	'@wordpress/data',
	() =>
		new Proxy(
			{ useSelect: () => [] },
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@wordpress/data' )[ prop ],
			}
		)
);

// Captures each render's `layout` prop so tests can assert the reportParams
// the page injects into its widget entries.
const mockDashboardLayouts: unknown[] = [];
jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( { children, layout }: { children: ReactNode; layout?: unknown } ) => {
		mockDashboardLayouts.push( layout );
		return <>{ children }</>;
	};
	WidgetDashboard.Widgets = () => <div>Video widgets</div>;

	return { WidgetDashboard, DEFAULT_GRID: {}, ROW_HEIGHT_PRESETS: { small: 200 } };
} );

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetTypes: () => [ [], false ],
} ) );

// The report registry is deliberately not mocked so the breadcrumb exercises
// the real report-origin validation.

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: Array< { label: string; to?: string } > } ) => (
		<nav aria-label="Breadcrumbs">
			{ items.map( ( item, index ) => {
				let content: ReactNode = item.label;
				if ( item.to ) {
					content = <a href={ item.to }>{ item.label }</a>;
				} else if ( index === items.length - 1 ) {
					content = <h1>{ item.label }</h1>;
				}

				return (
					<span key={ index } role="listitem">
						{ content }
					</span>
				);
			} ) }
		</nav>
	),
	Page: ( { breadcrumbs, children }: { breadcrumbs: ReactNode; children: ReactNode } ) => (
		<main>
			{ breadcrumbs }
			{ children }
		</main>
	),
} ) );

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../tests/js/route-test-utils' );

	return {
		Link: mockWordPressRoute.Link,
		useParams: () => ( { videoId: '42' } ),
		useSearch: () => mockSearch,
	};
} );

jest.mock( './hooks', () => ( {
	useVideoSummary: jest.fn(),
} ) );

const mockUseVideoSummary = useVideoSummary as jest.Mock;
const refetch = jest.fn();

/**
 * Stubs the video summary hook, defaulting to a resolved video with no title.
 *
 * @param overrides - Fields to override on the default summary.
 */
function mockSummary( overrides: Record< string, unknown > = {} ) {
	mockUseVideoSummary.mockReturnValue( {
		title: undefined,
		publishedDate: undefined,
		isLoading: false,
		isError: false,
		isNotFound: false,
		refetch,
		...overrides,
	} );
}

describe( 'video detail stage', () => {
	// The page only renders on sites running VideoPress, and the report registry
	// behind the Videos crumb reads that from script data.
	beforeAll( () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: { premium_analytics: { has_videopress: true } },
		} );
	} );

	beforeEach( () => {
		jest.clearAllMocks();
		mockDashboardLayouts.length = 0;
		mockSearch = {
			from: '2026-06-01',
			to: '2026-06-16',
			section: 'embeds',
		};
	} );

	afterAll( () => {
		delete window.JetpackScriptData;
	} );

	it( 'shows a not-found state with a date-preserving link back to Videos', () => {
		mockSummary( { isNotFound: true } );

		render( stage() );

		expect( screen.getByText( "We couldn't find this video." ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Back to Videos' } ) ).toHaveAttribute(
			'href',
			'/reports/videos?from=2026-06-01&to=2026-06-16'
		);
		expect( screen.queryByRole( 'heading', { level: 1 } ) ).not.toBeInTheDocument();
	} );

	it.each( [ { isLoading: true }, { isError: true }, { isNotFound: true } ] )(
		'shows only the Stats crumb and does not mount widgets while no video is available',
		summary => {
			mockSummary( summary );

			render( stage() );

			const nav = screen.getByRole( 'navigation', { name: 'Breadcrumbs' } );
			// Only the Stats crumb renders until a title resolves.
			const crumbs = within( nav ).getAllByRole( 'listitem' );
			expect( crumbs ).toHaveLength( 1 );
			expect( crumbs[ 0 ] ).toHaveTextContent( 'Stats' );
			expect( within( crumbs[ 0 ] ).getByRole( 'link', { name: 'Stats' } ) ).toHaveAttribute(
				'href',
				'/?from=2026-06-01&to=2026-06-16'
			);
			expect( screen.queryByRole( 'heading', { level: 1 } ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Video widgets' ) ).not.toBeInTheDocument();
		}
	);

	/**
	 * Find the summary card's `h1` while skipping the breadcrumb title crumb —
	 * admin-ui renders the current crumb as an `h1` too, so an unscoped heading
	 * query matches both.
	 *
	 * @param name - The accessible heading name.
	 * @return The summary card heading.
	 */
	function getSummaryHeading( name: string ): HTMLElement {
		const nav = screen.getByRole( 'navigation', { name: 'Breadcrumbs' } );
		const heading = screen
			.getAllByRole( 'heading', { level: 1, name } )
			.find( node => ! nav.contains( node ) );
		if ( ! heading ) {
			throw new Error( `No summary heading named "${ name }" outside the breadcrumbs.` );
		}
		return heading;
	}

	it( 'renders the poster thumbnail and swaps in the placeholder glyph when it fails', () => {
		mockSummary( {
			title: 'Launch recap',
			posterUrl: 'https://i0.wp.com/videos.files.wordpress.com/abcd1234/launch-recap.jpg',
		} );

		// The placeholder is decorative (`aria-hidden`), so it has no role or
		// text to query; find its glyph block structurally.
		const placeholderGlyph = () =>
			// eslint-disable-next-line testing-library/no-node-access -- The aria-hidden placeholder has no accessible query target.
			document.querySelector( 'div[aria-hidden="true"] svg' );

		render( stage() );

		const poster = screen.getByRole( 'presentation' );
		expect( poster ).toHaveAttribute(
			'src',
			'https://i0.wp.com/videos.files.wordpress.com/abcd1234/launch-recap.jpg'
		);
		expect( placeholderGlyph() ).not.toBeInTheDocument();

		// A tokenless poster (private video) 404s; the broken image must swap
		// itself for the video-glyph placeholder, keeping the image slot.
		fireEvent.error( poster );
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect( placeholderGlyph() ).toBeInTheDocument();
		expect( getSummaryHeading( 'Launch recap' ) ).toBeInTheDocument();
	} );

	it( 'renders the placeholder glyph when the video has no poster', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-node-access -- The aria-hidden placeholder has no accessible query target.
			document.querySelector( 'div[aria-hidden="true"] svg' )
		).toBeInTheDocument();
	} );

	it( 'keeps a long unbroken title single-line-ready: full text in markup plus the hover attr', () => {
		// Layout is out of jsdom's reach; the single-line clip is CSS
		// (`white-space: nowrap` + ellipsis on `.title`, with the breadcrumb
		// slot's shrink fix in stage.module.scss keeping the page from
		// horizontal scrolling). This guards the DOM contract the clip relies
		// on: the heading carries the full untruncated text and mirrors it in
		// `title`, so the ellipsized line stays reachable on hover.
		const longTitle = `VID_20260731_${ 'a'.repeat( 120 ) }.mp4`;
		mockSummary( { title: longTitle } );

		render( stage() );

		const heading = getSummaryHeading( longTitle );
		expect( heading ).toHaveAttribute( 'title', longTitle );
	} );

	it( 'adds the resolved title crumb', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getAllByRole( 'listitem' ) ).toHaveLength( 2 );
		expect( breadcrumbs.getAllByRole( 'listitem' ).map( crumb => crumb.textContent ) ).toEqual( [
			'Stats',
			'Launch recap',
		] );
		expect(
			breadcrumbs.getByRole( 'heading', { level: 1, name: 'Launch recap' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Video widgets' ) ).toBeInTheDocument();
	} );

	it( 'adds the referring report between Stats and the resolved title', () => {
		mockSearch = { ...mockSearch, ref: 'videos' };
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getAllByRole( 'listitem' ).map( crumb => crumb.textContent ) ).toEqual( [
			'Stats',
			'Videos',
			'Launch recap',
		] );
	} );

	it( 'states the applied report range as the performance window in the summary', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect(
			screen.getByText( /Performance from Jun 1, 2026 to Jun 16, 2026/ )
		).toBeInTheDocument();
	} );

	it( 'renders the date filters without the comparison control', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect( screen.getByText( 'Date filters without comparison' ) ).toBeInTheDocument();
	} );

	it( 'injects comparison-stripped report params into every layout entry', () => {
		mockSummary( { title: 'Launch recap' } );
		mockSearch = {
			from: '2026-06-01',
			to: '2026-06-16',
			post_id: '42',
			comp: '1',
			compare_from: '2026-05-17',
			compare_to: '2026-05-31',
			compare_preset: 'previous-period',
		};

		render( stage() );

		const layout = mockDashboardLayouts.at( -1 ) as Array< {
			attributes?: { reportParams?: Record< string, unknown > };
		} >;
		expect( layout.length ).toBeGreaterThan( 0 );
		for ( const widget of layout ) {
			expect( widget.attributes?.reportParams ).toEqual( {
				from: '2026-06-01',
				to: '2026-06-16',
				post_id: '42',
			} );
		}
	} );
} );
