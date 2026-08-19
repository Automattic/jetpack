import { useReportScope } from '@jetpack-premium-analytics/routing';
import { render, screen, within } from '@testing-library/react';
import { usePostSummary } from './hooks';
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
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
	useReportDateFilters: () => ( {} ),
} ) );

// Avoid loading DataViews while keeping the real breadcrumbs for these assertions.
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: ( { showComparison }: { showComparison?: boolean } ) => (
		<div>{ showComparison === false ? 'Date filters without comparison' : 'Date filters' }</div>
	),
	SectionTabPanel: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	StatsBreadcrumbs: jest.requireActual( '../../packages/ui/src/stats-breadcrumbs' )
		.StatsBreadcrumbs,
	StatsPageIcon: () => null,
	// The real guard is covered in the ui package; keep the scheme check here so
	// the header still refuses a non-http URL.
	safeHttpUrl: ( value?: string | null ) =>
		value && /^https?:\/\//.test( value ) ? value : undefined,
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

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

/**
 * Reads the scope from where the page's widgets render.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();

	return <div>{ offersComparison ? 'Post widgets' : 'Post widgets without comparison' }</div>;
}

jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( { children }: { children: ReactNode } ) => <>{ children }</>;
	WidgetDashboard.Widgets = () => <MockScopeProbe />;

	return {
		WidgetDashboard,
		DEFAULT_GRID: {},
		ROW_HEIGHT_PRESETS: { small: 200 },
	};
} );

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetTypes: () => [ [], false ],
} ) );

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
	Page: ( {
		breadcrumbs,
		actions,
		children,
	}: {
		breadcrumbs: ReactNode;
		actions: ReactNode;
		children: ReactNode;
	} ) => (
		<main>
			{ breadcrumbs }
			<div data-testid="page-actions">{ actions }</div>
			{ children }
		</main>
	),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useParams: () => ( { postId: '41' } ),
	useSearch: () => mockSearch,
} ) );

// The report registry is deliberately not mocked so the breadcrumb exercises
// the real report-origin validation.

jest.mock( './components', () => ( {
	PostDetailTabs: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	PostSummaryCard: () => <div>Post summary</div>,
} ) );

jest.mock( './hooks', () => ( {
	usePostSummary: jest.fn(),
	usePostDetailTabs: () => ( {
		// One tab, so the panel carrying the widget grid actually mounts.
		tabs: [ { id: 'traffic', label: 'Traffic' } ],
		activeTab: 'traffic',
		setActiveTab: jest.fn(),
		layout: [],
	} ),
} ) );

const mockUsePostSummary = usePostSummary as jest.Mock;

/**
 * Stub the post summary hook, defaulting to a resolved post with a public URL.
 *
 * @param overrides - Fields to override on the default summary.
 */
function mockSummary( overrides: Record< string, unknown > = {} ) {
	mockUsePostSummary.mockReturnValue( {
		title: 'Hello world',
		type: 'post',
		publishedDate: '2026-06-22 18:00:00',
		imageUrl: undefined,
		url: 'https://example.com/hello-world/',
		isLoading: false,
		...overrides,
	} );
}

/**
 * Read the breadcrumb labels rendered by the page, in order.
 *
 * @return The visible breadcrumb labels.
 */
function getBreadcrumbLabels(): ( string | null )[] {
	const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );

	return breadcrumbs.getAllByRole( 'listitem' ).map( crumb => crumb.textContent );
}

describe( 'post detail stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSearch = { from: '2026-06-01', to: '2026-06-16', post_id: '41' };
	} );

	it( 'puts a View post action in the page header, opening the live post in a new tab', () => {
		mockSummary();

		render( stage() );

		const action = screen.getByRole( 'link', { name: 'View post' } );
		expect( action ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );
		expect( action ).toHaveAttribute( 'target', '_blank' );
		expect( action ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'labels the action View page for a page', () => {
		mockSummary( { type: 'page', url: 'https://example.com/about/' } );

		render( stage() );

		expect( screen.getByRole( 'link', { name: 'View page' } ) ).toHaveAttribute(
			'href',
			'https://example.com/about/'
		);
		expect( screen.queryByRole( 'link', { name: 'View post' } ) ).not.toBeInTheDocument();
	} );

	it( 'omits the action while the post URL is unresolved', () => {
		mockSummary( { url: undefined } );

		render( stage() );

		expect( screen.queryByRole( 'link', { name: /^View (post|page)$/ } ) ).not.toBeInTheDocument();
	} );

	it( 'omits the action when the post URL carries an unsupported scheme', () => {
		mockSummary( { url: 'javascript:alert(1)' } );

		render( stage() );

		expect( screen.queryByRole( 'link', { name: /^View (post|page)$/ } ) ).not.toBeInTheDocument();
	} );

	it( 'renders the date filters without the comparison control', () => {
		mockSummary();

		render( stage() );

		expect( screen.getByText( 'Date filters without comparison' ) ).toBeInTheDocument();
	} );

	it( 'declares no comparison for the widgets it renders', () => {
		mockSummary();

		render( stage() );

		expect( screen.getByText( 'Post widgets without comparison' ) ).toBeInTheDocument();
	} );

	it( 'keeps the two-crumb trail when no report origin is present', () => {
		mockSummary();

		render( stage() );

		expect( getBreadcrumbLabels() ).toEqual( [ 'Stats', 'Hello world' ] );
	} );

	it( 'adds the referring report between Stats and the resolved title', () => {
		mockSummary();
		mockSearch = { ...mockSearch, ref: 'posts' };

		render( stage() );

		expect( getBreadcrumbLabels() ).toEqual( [ 'Stats', 'All pages', 'Hello world' ] );
	} );

	it.each( [ { title: undefined, isLoading: true }, { title: '' } ] )(
		'keeps the Stats crumb linked while the post title is unresolved or empty',
		summary => {
			mockSummary( summary );

			render( stage() );

			const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
			const crumbs = breadcrumbs.getAllByRole( 'listitem' );
			expect( crumbs ).toHaveLength( 1 );
			expect( within( crumbs[ 0 ] ).getByRole( 'link', { name: 'Stats' } ) ).toHaveAttribute(
				'href',
				'/?from=2026-06-01&to=2026-06-16'
			);
			expect( breadcrumbs.queryByRole( 'heading', { level: 1 } ) ).not.toBeInTheDocument();
		}
	);
} );
