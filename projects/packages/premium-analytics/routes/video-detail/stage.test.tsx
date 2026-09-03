import { useReportScope } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useVideoSummary } from './hooks';
import { stage } from './stage';
import type { ReactNode } from 'react';

let mockSearch: Record< string, unknown > = {};

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	// Spreads the real module so the tab configs (which call `defineReportTabs`)
	// resolve, and `buildReportLink`/`pickReportDateParams` build real hrefs below.
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
	useReportDateFilters: () => ( {
		appliedRange: { from: new Date( 2026, 5, 1 ), to: new Date( 2026, 5, 16 ) },
		replaceRange: () => {},
		timeZone: 'UTC',
		interval: 'day',
		intervalOptions: [ 'day', 'week' ],
	} ),
} ) );

// Avoid loading DataViews while keeping the real breadcrumbs for these assertions.
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => <div>Date filters</div>,
	SectionHeader: jest.requireActual( '../../packages/ui/src/section-header' ).SectionHeader,
	StatsBreadcrumbs: jest.requireActual( '../../packages/ui/src/stats-breadcrumbs' )
		.StatsBreadcrumbs,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Falls through to the real module except `useSelect`: the externals path pulls
// in `@wordpress/rich-text`, whose store calls `combineReducers` at import time,
// so `requireActual` must stay lazy or it re-enters the module mid-init.
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

/**
 * Reads the scope from where the page's widgets render.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();

	return (
		<>
			<div>Video widgets</div>
			<div>{ offersComparison ? 'Scope offers comparison' : 'Scope offers no comparison' }</div>
		</>
	);
}

// Captures each render's `layout` prop so tests can assert what the page hands
// the dashboard.
const mockDashboardLayouts: unknown[] = [];
jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( { children, layout }: { children: ReactNode; layout?: unknown } ) => {
		mockDashboardLayouts.push( layout );
		return <>{ children }</>;
	};
	WidgetDashboard.Widgets = () => <MockScopeProbe />;

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
		expect( getSummaryHeading( 'Video not found' ) ).toBeInTheDocument();
	} );

	it.each( [
		{ summary: { isLoading: true }, heading: 'Loading…' },
		{ summary: { isError: true }, heading: 'Video unavailable' },
		{ summary: { isNotFound: true }, heading: 'Video not found' },
	] )(
		'names the page and keeps its date controls while no video is available',
		( { summary, heading } ) => {
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
			expect( getSummaryHeading( heading ) ).toBeInTheDocument();
			expect( screen.getByText( 'Date filters' ) ).toBeInTheDocument();
			// No window is worth stating without a video behind it.
			expect( screen.queryByText( /Performance from/ ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Video widgets' ) ).not.toBeInTheDocument();
		}
	);

	/**
	 * Find the page heading while skipping the breadcrumb title crumb — admin-ui
	 * renders the current crumb as an `h1` too, so an unscoped heading query
	 * matches both.
	 *
	 * @param name - The accessible heading name.
	 * @return The page heading.
	 */
	function getSummaryHeading( name: string ): HTMLElement {
		const nav = screen.getByRole( 'navigation', { name: 'Breadcrumbs' } );
		const heading = screen
			.getAllByRole( 'heading', { level: 1, name } )
			.find( node => ! nav.contains( node ) );
		if ( ! heading ) {
			throw new Error( `No page heading named "${ name }" outside the breadcrumbs.` );
		}
		return heading;
	}

	it( 'renders the poster thumbnail and swaps in the placeholder glyph when it fails', () => {
		mockSummary( {
			title: 'Launch recap',
			posterUrl: 'https://i0.wp.com/videos.files.wordpress.com/abcd1234/launch-recap.jpg',
		} );

		// The whole visual slot is decorative (`aria-hidden`), so both the poster
		// and the placeholder live outside the accessibility tree.
		const placeholderGlyph = () =>
			// eslint-disable-next-line testing-library/no-node-access -- The aria-hidden placeholder has no accessible query target.
			document.querySelector( 'div[aria-hidden="true"] svg' );

		render( stage() );

		const poster = screen.getByRole( 'presentation', { hidden: true } );
		expect( poster ).toHaveAttribute(
			'src',
			'https://i0.wp.com/videos.files.wordpress.com/abcd1234/launch-recap.jpg'
		);
		expect( placeholderGlyph() ).not.toBeInTheDocument();

		// A tokenless poster (private video) 404s; the broken image must swap
		// itself for the video-glyph placeholder, keeping the image slot.
		fireEvent.error( poster );
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
		expect( placeholderGlyph() ).toBeInTheDocument();
		expect( getSummaryHeading( 'Launch recap' ) ).toBeInTheDocument();
	} );

	it( 'renders the placeholder glyph when the video has no poster', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-node-access -- The aria-hidden placeholder has no accessible query target.
			document.querySelector( 'div[aria-hidden="true"] svg' )
		).toBeInTheDocument();
	} );

	it( 'keeps a long unbroken title single-line-ready: full text in markup plus the hover attr', () => {
		// Layout is out of jsdom's reach (the clip is CSS, `white-space: nowrap` +
		// ellipsis, in `section-header.module.scss`), so this guards the DOM contract
		// it relies on: full text in the heading, mirrored in `title` for hover access.
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

	// One declaration drives both halves: the panel drops the Compare control and
	// `WidgetRoot` strips the params. This asserts the page's declaration.
	it( 'declares no comparison for the widgets it renders', () => {
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

		expect( screen.getByText( 'Scope offers no comparison' ) ).toBeInTheDocument();
	} );

	// The layout the page hands the dashboard is the fixed composition; the
	// no-comparison invariant is the scope above, not injected attributes.
	it( 'hands the dashboard its fixed layout', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		const layout = mockDashboardLayouts.at( -1 ) as Array< {
			attributes?: { reportParams?: unknown };
		} >;
		expect( layout.length ).toBeGreaterThan( 0 );
		for ( const widget of layout ) {
			expect( widget.attributes ?? {} ).not.toHaveProperty( 'reportParams' );
		}
	} );
} );
