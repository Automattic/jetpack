import { useReportScope } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import { usePostDetailTabs, usePostSummary } from './hooks';
import { stage } from './stage';
import type { ReactNode } from 'react';

let mockSearch: Record< string, unknown > = {};

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	// Spread the real module so the report registry's tab configs, which call
	// `defineReportTabs`, still resolve now that the registry is not mocked.
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
	useReportDateFilters: () => ( {
		appliedRange: {},
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

// Proxies `@wordpress/data` lazily: `requireActual` at import time would
// re-enter `@wordpress/rich-text`'s module init via `combineReducers`.
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
	postHeaderSlots: ( {
		performanceRange,
	}: {
		performanceRange?: { from?: Date; to?: Date };
	} ) => ( {
		title: 'Post summary',
		subTitle: (
			<span data-testid="performance-from">
				{ performanceRange?.from?.toISOString() ?? 'none' }
			</span>
		),
	} ),
} ) );

let mockActiveTab = 'traffic';

// The pinned email scope the stage hands to the tabs hook and the header.
const mockEmailScope = {
	range: { from: new Date( '2026-06-22T00:00:00Z' ), to: new Date( '2026-07-21T23:59:59Z' ) },
	reportParams: {
		post_id: 41,
		from: '2026-06-22',
		to: '2026-07-21',
		interval: 'day',
	},
};

jest.mock( './hooks', () => ( {
	usePostSummary: jest.fn(),
	useEmailTabScope: jest.fn( () => mockEmailScope ),
	usePostDetailTabs: jest.fn( () => ( {
		// The active tab mounts the panel carrying the widget grid.
		tabs: [
			{ id: 'traffic', label: 'Traffic' },
			{ id: 'email-opens', label: 'Email opens' },
		],
		activeTab: mockActiveTab,
		setActiveTab: jest.fn(),
		layout: [],
	} ) ),
} ) );

const mockUsePostSummary = usePostSummary as jest.Mock;
const mockUsePostDetailTabs = usePostDetailTabs as jest.Mock;

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
		mockActiveTab = 'traffic';
	} );

	it( 'shows the date filter on the traffic tab', () => {
		mockSummary();

		render( stage() );

		expect( screen.getByText( 'Date filters' ) ).toBeInTheDocument();
	} );

	it( 'hides the date filter on the email tabs and pins them to the send window', () => {
		mockActiveTab = 'email-opens';
		mockSummary();

		render( stage() );

		expect( screen.queryByText( 'Date filters' ) ).not.toBeInTheDocument();
		// The shared summary header still renders, over the pinned window.
		expect( screen.getByText( 'Post summary' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'performance-from' ) ).toHaveTextContent(
			'2026-06-22T00:00:00.000Z'
		);
		// The tabs hook receives the pinned params for the email tabs' widgets.
		expect( mockUsePostDetailTabs ).toHaveBeenCalledWith( 41, mockEmailScope.reportParams, false );
	} );

	it( 'reports the traffic tab over the applied URL range', () => {
		mockSummary();

		render( stage() );

		expect( screen.getByTestId( 'performance-from' ) ).toHaveTextContent( 'none' );
	} );

	it( 'puts a View post action in the page header, opening the live post in a new tab', () => {
		mockSummary();

		render( stage() );

		// `openInNewTab` appends a screen-reader hint to the accessible name.
		const action = screen.getByRole( 'link', { name: 'View post(opens in a new tab)' } );
		expect( action ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );
		expect( action ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'labels the action View page for a page', () => {
		mockSummary( { type: 'page', url: 'https://example.com/about/' } );

		render( stage() );

		expect( screen.getByRole( 'link', { name: 'View page(opens in a new tab)' } ) ).toHaveAttribute(
			'href',
			'https://example.com/about/'
		);
		expect(
			screen.queryByRole( 'link', { name: 'View post(opens in a new tab)' } )
		).not.toBeInTheDocument();
	} );

	it( 'omits the action while the post URL is unresolved', () => {
		mockSummary( { url: undefined } );

		render( stage() );

		expect( screen.queryByRole( 'link', { name: /^View (post|page)/ } ) ).not.toBeInTheDocument();
	} );

	it( 'omits the action when the post URL carries an unsupported scheme', () => {
		mockSummary( { url: 'javascript:alert(1)' } );

		render( stage() );

		expect( screen.queryByRole( 'link', { name: /^View (post|page)/ } ) ).not.toBeInTheDocument();
	} );

	// One declaration drives both halves: the panel drops the Compare control and
	// `WidgetRoot` strips the params. This asserts the page's declaration.
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
